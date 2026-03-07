from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks, UploadFile, File, Depends, Header, Request
from fastapi.responses import FileResponse, JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import sys
import asyncio
import resend
import httpx

sys.path.insert(0, os.path.abspath(''))
from emergentintegrations.llm.openai.video_generation import OpenAIVideoGeneration
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Initialize Resend
resend.api_key = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# JWT config
JWT_SECRET = os.environ.get('JWT_SECRET')
JWT_ALGORITHM = "HS256"

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

VIDEO_OUTPUT_DIR = Path("/app/backend/generated_videos")
VIDEO_OUTPUT_DIR.mkdir(exist_ok=True)

# ============================================================
# PLAN DEFINITIONS (server-side only — never trust frontend)
# ============================================================
PLANS = {
    "free": {"name": "Free", "price": 0, "videos_per_month": 4, "templates": "basic"},
    "pro": {"name": "Pro", "price": 9.99, "videos_per_month": 999999, "templates": "all"},
    "lifetime": {"name": "Lifetime", "price": 19.99, "videos_per_month": 999999, "templates": "all"},
}

# ============================================================
# AUTH MODELS
# ============================================================
class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = ""

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    plan: str
    videos_this_month: int
    videos_limit: int
    is_admin: bool
    created_at: str

# ============================================================
# AUTH HELPERS
# ============================================================
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, email: str, is_admin: bool = False) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "is_admin": is_admin,
        "exp": datetime.now(timezone.utc) + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_admin_user(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def check_video_limit(user: dict):
    """Check if user has exceeded their monthly video limit"""
    plan = user.get("plan", "free")
    limit = PLANS[plan]["videos_per_month"]
    
    # Reset monthly count if new month
    now = datetime.now(timezone.utc)
    reset_date = user.get("videos_month_reset", "")
    if reset_date:
        try:
            reset_dt = datetime.fromisoformat(reset_date)
            if now.month != reset_dt.month or now.year != reset_dt.year:
                await db.users.update_one({"id": user["id"]}, {"$set": {
                    "videos_this_month": 0,
                    "videos_month_reset": now.isoformat()
                }})
                user["videos_this_month"] = 0
        except (ValueError, TypeError):
            pass
    
    if user.get("videos_this_month", 0) >= limit:
        raise HTTPException(status_code=403, detail=f"Monthly video limit reached ({limit} videos). Upgrade your plan for more.")

# ============================================================
# AUTH ENDPOINTS
# ============================================================
@api_router.post("/auth/register")
async def register(request: RegisterRequest):
    existing = await db.users.find_one({"email": request.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    user_doc = {
        "id": user_id,
        "email": request.email.lower(),
        "password_hash": hash_password(request.password),
        "name": request.name or request.email.split("@")[0],
        "plan": "free",
        "plan_expires_at": None,
        "videos_this_month": 0,
        "videos_month_reset": now,
        "is_admin": False,
        "created_at": now
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, request.email.lower())
    return {
        "token": token,
        "user": {
            "id": user_id, "email": request.email.lower(), "name": user_doc["name"],
            "plan": "free", "videos_this_month": 0, "videos_limit": PLANS["free"]["videos_per_month"],
            "is_admin": False, "created_at": now
        }
    }

@api_router.post("/auth/login")
async def login(request: LoginRequest):
    user = await db.users.find_one({"email": request.email.lower()}, {"_id": 0})
    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user["id"], user["email"], user.get("is_admin", False))
    plan = user.get("plan", "free")
    return {
        "token": token,
        "user": {
            "id": user["id"], "email": user["email"], "name": user.get("name", ""),
            "plan": plan, "videos_this_month": user.get("videos_this_month", 0),
            "videos_limit": PLANS[plan]["videos_per_month"],
            "is_admin": user.get("is_admin", False), "created_at": user.get("created_at", "")
        }
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    plan = user.get("plan", "free")
    return {
        "id": user["id"], "email": user["email"], "name": user.get("name", ""),
        "plan": plan, "videos_this_month": user.get("videos_this_month", 0),
        "videos_limit": PLANS[plan]["videos_per_month"],
        "is_admin": user.get("is_admin", False), "created_at": user.get("created_at", ""),
        "picture": user.get("picture", "")
    }

# ============================================================
# GOOGLE OAUTH (Emergent Auth)
# ============================================================
class GoogleCallbackRequest(BaseModel):
    session_id: str

@api_router.post("/auth/google/callback")
async def google_callback(request: GoogleCallbackRequest):
    """Exchange Emergent OAuth session_id for a JWT token"""
    # Call Emergent Auth to get user data
    async with httpx.AsyncClient() as client_http:
        response = await client_http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": request.session_id}
        )
    
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google session")
    
    google_data = response.json()
    email = google_data.get("email", "").lower()
    name = google_data.get("name", "")
    picture = google_data.get("picture", "")
    
    if not email:
        raise HTTPException(status_code=400, detail="No email from Google")
    
    # Find or create user
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        # Update name/picture if changed
        await db.users.update_one({"email": email}, {"$set": {"name": name, "picture": picture}})
        user_id = existing["id"]
        plan = existing.get("plan", "free")
        is_admin = existing.get("is_admin", False)
        videos_this_month = existing.get("videos_this_month", 0)
        created_at = existing.get("created_at", "")
    else:
        user_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        user_doc = {
            "id": user_id,
            "email": email,
            "password_hash": "",
            "name": name,
            "picture": picture,
            "plan": "free",
            "plan_expires_at": None,
            "videos_this_month": 0,
            "videos_month_reset": now,
            "is_admin": False,
            "created_at": now,
            "auth_provider": "google"
        }
        await db.users.insert_one(user_doc)
        plan = "free"
        is_admin = False
        videos_this_month = 0
        created_at = now
    
    token = create_token(user_id, email, is_admin)
    return {
        "token": token,
        "user": {
            "id": user_id, "email": email, "name": name, "picture": picture,
            "plan": plan, "videos_this_month": videos_this_month,
            "videos_limit": PLANS[plan]["videos_per_month"],
            "is_admin": is_admin, "created_at": created_at
        }
    }

# ============================================================
# STRIPE CHECKOUT ENDPOINTS
# ============================================================
@api_router.post("/checkout/create")
async def create_checkout(plan_id: str, request: Request, user: dict = Depends(get_current_user)):
    if plan_id not in ("pro", "lifetime"):
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    amount = PLANS[plan_id]["price"]
    host_url = str(request.base_url).rstrip("/")
    origin_url = request.headers.get("origin", host_url)
    
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(
        api_key=os.environ['STRIPE_API_KEY'],
        webhook_url=webhook_url
    )
    
    success_url = f"{origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/pricing"
    
    checkout_request = CheckoutSessionRequest(
        amount=float(amount),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["id"],
            "user_email": user["email"],
            "plan_id": plan_id
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Record transaction
    await db.payment_transactions.insert_one({
        "session_id": session.session_id,
        "user_id": user["id"],
        "email": user["email"],
        "plan_id": plan_id,
        "amount": amount,
        "currency": "usd",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/checkout/status/{session_id}")
async def check_checkout_status(session_id: str, request: Request, user: dict = Depends(get_current_user)):
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(
        api_key=os.environ['STRIPE_API_KEY'],
        webhook_url=webhook_url
    )
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction
    txn = await db.payment_transactions.find_one({"session_id": session_id})
    if txn and txn.get("payment_status") != "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "payment_status": status.payment_status,
                "status": status.status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # If paid, upgrade user plan
        if status.payment_status == "paid":
            plan_id = txn.get("plan_id", "pro")
            update_fields = {"plan": plan_id}
            if plan_id == "pro":
                update_fields["plan_expires_at"] = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
            
            await db.users.update_one(
                {"id": txn["user_id"]},
                {"$set": update_fields}
            )
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature", "")
    
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(
        api_key=os.environ['STRIPE_API_KEY'],
        webhook_url=webhook_url
    )
    
    try:
        event = await stripe_checkout.handle_webhook(body, signature)
        
        if event.payment_status == "paid" and event.session_id:
            txn = await db.payment_transactions.find_one({"session_id": event.session_id})
            if txn and txn.get("payment_status") != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": event.session_id},
                    {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
                plan_id = event.metadata.get("plan_id", "pro")
                update_fields = {"plan": plan_id}
                if plan_id == "pro":
                    update_fields["plan_expires_at"] = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
                await db.users.update_one({"id": txn["user_id"]}, {"$set": update_fields})
        
        return {"status": "ok"}
    except Exception as e:
        logging.error(f"Webhook error: {str(e)}")
        return {"status": "error"}

# ============================================================
# ADMIN ENDPOINTS
# ============================================================
@api_router.get("/admin/users")
async def admin_list_users(admin: dict = Depends(get_admin_user), page: int = 0, limit: int = 50):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).skip(page * limit).limit(limit).to_list(limit)
    total = await db.users.count_documents({})
    return {"users": users, "total": total, "page": page, "limit": limit}

@api_router.put("/admin/users/{user_id}/plan")
async def admin_update_plan(user_id: str, plan: str, admin: dict = Depends(get_admin_user)):
    if plan not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_fields = {"plan": plan}
    if plan == "pro":
        update_fields["plan_expires_at"] = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    elif plan == "lifetime":
        update_fields["plan_expires_at"] = None
    elif plan == "free":
        update_fields["plan_expires_at"] = None
    
    await db.users.update_one({"id": user_id}, {"$set": update_fields})
    return {"message": f"User plan updated to {plan}"}

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}

@api_router.put("/admin/users/{user_id}/toggle-admin")
async def admin_toggle_admin(user_id: str, admin: dict = Depends(get_admin_user)):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    new_admin = not user.get("is_admin", False)
    await db.users.update_one({"id": user_id}, {"$set": {"is_admin": new_admin}})
    return {"message": f"Admin status: {new_admin}"}

@api_router.get("/admin/revenue")
async def admin_revenue(admin: dict = Depends(get_admin_user)):
    # Use aggregation for efficient revenue calculation
    revenue_pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
    ]
    revenue_result = await db.payment_transactions.aggregate(revenue_pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    txn_count = revenue_result[0]["count"] if revenue_result else 0
    
    # Use aggregation for plan distribution
    plan_pipeline = [{"$group": {"_id": "$plan", "count": {"$sum": 1}}}]
    plan_result = await db.users.aggregate(plan_pipeline).to_list(10)
    plan_counts = {"free": 0, "pro": 0, "lifetime": 0}
    for p in plan_result:
        plan_id = p.get("_id", "free") or "free"
        if plan_id in plan_counts:
            plan_counts[plan_id] = p.get("count", 0)
    
    total_users = await db.users.count_documents({})
    
    return {
        "total_revenue": round(total_revenue, 2),
        "transactions": txn_count,
        "plan_distribution": plan_counts,
        "total_users": total_users
    }

@api_router.get("/plans")
async def get_plans():
    """Public endpoint for pricing page"""
    return {
        "plans": [
            {"id": "free", "name": "Free", "price": 0, "period": "", "features": ["4 videos per month", "Basic templates", "HD resolution", "Community gallery"]},
            {"id": "pro", "name": "Pro", "price": 9.99, "period": "/month", "features": ["Unlimited videos", "All templates", "All resolutions", "Email notifications", "Priority generation", "Batch generation"]},
            {"id": "lifetime", "name": "Lifetime", "price": 19.99, "period": "one-time", "features": ["Everything in Pro", "Forever access", "No monthly payments", "Future features included", "Priority support"]},
        ]
    }

class VideoRequest(BaseModel):
    prompt: str
    model: str = "sora-2"
    size: str = "1280x720"
    duration: int = 4
    add_voiceover: bool = False
    voiceover_text: Optional[str] = None
    notify_email: Optional[str] = None

class BatchVideoRequest(BaseModel):
    videos: List[VideoRequest]

class VideoResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    prompt: str
    model: str
    size: str
    duration: int
    status: str
    video_url: Optional[str] = None
    created_at: str
    error: Optional[str] = None
    shared: bool = False
    likes: int = 0
    views: int = 0
    shares: int = 0
    user_id: Optional[str] = None

class VideoHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    videos: List[VideoResponse]

class ShareVideoRequest(BaseModel):
    video_id: str
    share_to_gallery: bool = True

class Template(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    category: str
    prompt: str
    thumbnail: str
    model: str = "sora-2"
    size: str = "1280x720"
    duration: int = 4
    is_custom: bool = False
    created_by: Optional[str] = None

class CreateTemplateRequest(BaseModel):
    name: str
    category: str
    prompt: str
    model: str = "sora-2"
    size: str = "1280x720"
    duration: int = 4

class ScheduleVideoRequest(BaseModel):
    video_id: str
    scheduled_time: str
    platforms: List[str]

class VideoAnalytics(BaseModel):
    model_config = ConfigDict(extra="ignore")
    video_id: str
    views: int = 0
    likes: int = 0
    shares: int = 0
    view_history: List[str] = []
    engagement_rate: float = 0.0

class TeamMember(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    email: str
    role: str
    joined_at: str

# Pre-defined templates
TEMPLATES = [
    {
        "id": "tmpl-1",
        "name": "Product Launch Teaser",
        "category": "Marketing",
        "prompt": "Cinematic product reveal with dramatic lighting, slow-motion unboxing, floating product in spotlight, premium feel, luxury branding",
        "thumbnail": "🎁",
        "model": "sora-2-pro",
        "size": "1792x1024",
        "duration": 8,
        "is_custom": False
    },
    {
        "id": "tmpl-2",
        "name": "Quick Tutorial",
        "category": "Education",
        "prompt": "Step-by-step software tutorial, clean interface, pointer highlights, smooth transitions, professional voiceover feel",
        "thumbnail": "📚",
        "size": "1280x720",
        "duration": 12,
        "is_custom": False
    },
    {
        "id": "tmpl-3",
        "name": "Social Media Ad",
        "category": "Marketing",
        "prompt": "Vertical mobile-first ad, fast cuts, bold text overlays, attention-grabbing hook, vibrant colors, TikTok style",
        "thumbnail": "📱",
        "size": "1024x1792",
        "duration": 4,
        "is_custom": False
    },
    {
        "id": "tmpl-4",
        "name": "Brand Story",
        "category": "Branding",
        "prompt": "Emotional brand narrative, inspiring journey, authentic moments, golden hour aesthetic, motivational music vibe",
        "thumbnail": "✨",
        "model": "sora-2-pro",
        "size": "1792x1024",
        "duration": 12,
        "is_custom": False
    },
    {
        "id": "tmpl-5",
        "name": "Feature Showcase",
        "category": "Product",
        "prompt": "Dynamic feature demonstration, smooth zoom transitions, modern UI elements, tech-forward aesthetic, engaging pacing",
        "thumbnail": "⚡",
        "size": "1280x720",
        "duration": 8,
        "is_custom": False
    },
    {
        "id": "tmpl-6",
        "name": "Testimonial Video",
        "category": "Social Proof",
        "prompt": "Authentic customer testimonial, natural setting, genuine emotion, relatable scenario, trustworthy feel",
        "thumbnail": "💬",
        "size": "1280x720",
        "duration": 8,
        "is_custom": False
    },
    {
        "id": "tmpl-7",
        "name": "Explainer Animation",
        "category": "Education",
        "prompt": "Animated explainer with colorful icons, smooth transitions, friendly tone, easy to understand concepts",
        "thumbnail": "🎨",
        "size": "1280x720",
        "duration": 12,
        "is_custom": False
    },
    {
        "id": "tmpl-8",
        "name": "Event Highlight",
        "category": "Events",
        "prompt": "Energetic event recap, crowd excitement, dynamic camera angles, upbeat atmosphere, celebration vibes",
        "thumbnail": "🎉",
        "model": "sora-2-pro",
        "size": "1792x1024",
        "duration": 8,
        "is_custom": False
    }
]

def _generate_video_sync(video_id: str, prompt: str, model: str, size: str, duration: int):
    """Synchronous video generation - runs in thread pool"""
    video_gen = OpenAIVideoGeneration(api_key=os.environ['EMERGENT_LLM_KEY'])
    output_path = str(VIDEO_OUTPUT_DIR / f"{video_id}.mp4")
    
    video_bytes = video_gen.text_to_video(
        prompt=prompt,
        model=model,
        size=size,
        duration=duration,
        max_wait_time=600
    )
    
    if video_bytes:
        video_gen.save_video(video_bytes, output_path)
        return output_path
    return None

async def send_video_notification(email: str, video_id: str, prompt: str, status: str):
    """Send email notification when video generation completes"""
    if not email or not resend.api_key:
        return
    
    app_url = os.environ.get('CORS_ORIGINS', 'https://movius-preview.preview.emergentagent.com').split(',')[0].strip()
    if app_url == '*':
        app_url = 'https://movius-preview.preview.emergentagent.com'
    
    if status == 'completed':
        subject = "Your Video is Ready!"
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 16px;">
            <h1 style="color: #a78bfa; margin-bottom: 8px;">Your Video is Ready!</h1>
            <p style="color: #94a3b8; font-size: 16px; margin-bottom: 24px;">Great news — your AI-generated video has finished processing.</p>
            <div style="background: #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
                <p style="color: #94a3b8; font-size: 14px; margin: 0 0 4px;">Video Description:</p>
                <p style="color: #e2e8f0; font-size: 15px; margin: 0;">{prompt[:150]}...</p>
            </div>
            <a href="{app_url}/library" style="display: inline-block; background: linear-gradient(135deg, #a78bfa, #f472b6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">
                View & Download Your Video
            </a>
            <p style="color: #475569; font-size: 13px; margin-top: 32px;">— Affiliate Pro EZ AD Creator</p>
        </div>
        """
    else:
        subject = "Video Generation Update"
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 16px;">
            <h1 style="color: #f59e0b; margin-bottom: 8px;">Video Generation Update</h1>
            <p style="color: #94a3b8; font-size: 16px; margin-bottom: 24px;">Unfortunately, your video didn't generate correctly this time. Don't worry — this happens occasionally with AI.</p>
            <a href="{app_url}/quick-create" style="display: inline-block; background: linear-gradient(135deg, #a78bfa, #f472b6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">
                Try Again
            </a>
            <p style="color: #475569; font-size: 13px; margin-top: 32px;">— Affiliate Pro EZ AD Creator</p>
        </div>
        """
    
    try:
        await asyncio.to_thread(resend.Emails.send, {
            "from": SENDER_EMAIL,
            "to": [email],
            "subject": subject,
            "html": html
        })
        logging.info(f"Notification email sent to {email} for video {video_id}")
    except Exception as e:
        logging.error(f"Failed to send email to {email}: {str(e)}")

async def generate_video_task(video_id: str, prompt: str, model: str, size: str, duration: int):
    """Background task to generate video using thread pool for blocking call"""
    try:
        result = await asyncio.to_thread(
            _generate_video_sync, video_id, prompt, model, size, duration
        )
        
        if result:
            await db.videos.update_one(
                {"id": video_id},
                {"$set": {
                    "status": "completed",
                    "video_url": f"/api/videos/{video_id}/download"
                }}
            )
            await db.analytics.insert_one({
                "video_id": video_id,
                "views": 0,
                "likes": 0,
                "shares": 0,
                "view_history": [],
                "engagement_rate": 0.0
            })
            logging.info(f"Video {video_id} generated successfully")
            
            # Send email notification
            video_doc = await db.videos.find_one({"id": video_id}, {"_id": 0})
            if video_doc and video_doc.get("notify_email"):
                await send_video_notification(video_doc["notify_email"], video_id, prompt, "completed")
        else:
            await db.videos.update_one(
                {"id": video_id},
                {"$set": {
                    "status": "failed",
                    "error": "Video generation returned empty result"
                }}
            )
            video_doc = await db.videos.find_one({"id": video_id}, {"_id": 0})
            if video_doc and video_doc.get("notify_email"):
                await send_video_notification(video_doc["notify_email"], video_id, prompt, "failed")
    except Exception as e:
        logging.error(f"Video generation failed for {video_id}: {str(e)}")
        await db.videos.update_one(
            {"id": video_id},
            {"$set": {
                "status": "failed",
                "error": str(e)
            }}
        )
        video_doc = await db.videos.find_one({"id": video_id}, {"_id": 0})
        if video_doc and video_doc.get("notify_email"):
            await send_video_notification(video_doc["notify_email"], video_id, prompt, "failed")

@api_router.get("/")
async def root():
    return {"message": "Affiliate Pro Video Generator API"}

@api_router.get("/templates", response_model=List[Template])
async def get_templates():
    """Get all video templates including custom ones"""
    custom_templates = await db.templates.find({}, {"_id": 0}).to_list(100)
    all_templates = [Template(**t) for t in TEMPLATES] + [Template(**t) for t in custom_templates]
    return all_templates

class TestEmailRequest(BaseModel):
    email: str

@api_router.post("/test-email")
async def test_email(request: TestEmailRequest):
    """Send a test email to verify Resend is working"""
    try:
        result = await asyncio.to_thread(resend.Emails.send, {
            "from": SENDER_EMAIL,
            "to": [request.email],
            "subject": "EZ AD Creator - Email Notifications Active!",
            "html": """
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 16px;">
                <h1 style="color: #22c55e; margin-bottom: 8px;">Notifications are set up!</h1>
                <p style="color: #94a3b8; font-size: 16px;">You'll now receive an email every time one of your videos finishes generating.</p>
                <p style="color: #475569; font-size: 13px; margin-top: 32px;">— Affiliate Pro EZ AD Creator</p>
            </div>
            """
        })
        return {"status": "success", "message": f"Test email sent to {request.email}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email failed: {str(e)}")

@api_router.post("/templates", response_model=Template)
async def create_custom_template(request: CreateTemplateRequest):
    """Create a custom template"""
    template_id = str(uuid.uuid4())
    
    template_doc = {
        "id": template_id,
        "name": request.name,
        "category": request.category,
        "prompt": request.prompt,
        "thumbnail": "⭐",
        "model": request.model,
        "size": request.size,
        "duration": request.duration,
        "is_custom": True,
        "created_by": "user",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.templates.insert_one(template_doc)
    return Template(**template_doc)

@api_router.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    """Delete a custom template"""
    result = await db.templates.delete_one({"id": template_id, "is_custom": True})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found or cannot be deleted")
    return {"message": "Template deleted successfully"}

@api_router.post("/videos/generate", response_model=VideoResponse)
async def generate_video(request: VideoRequest, background_tasks: BackgroundTasks, authorization: str = Header(None)):
    """Generate a video from text prompt"""
    user_id = "default_user"
    
    # If authenticated, check video limits
    if authorization and authorization.startswith("Bearer "):
        try:
            user = await get_current_user(authorization)
            await check_video_limit(user)
            user_id = user["id"]
            # Increment video count
            await db.users.update_one(
                {"id": user["id"]},
                {"$inc": {"videos_this_month": 1}}
            )
        except HTTPException:
            pass  # Allow unauthenticated usage for now
    
    video_id = str(uuid.uuid4())
    
    video_doc = {
        "id": video_id,
        "prompt": request.prompt,
        "model": request.model,
        "size": request.size,
        "duration": request.duration,
        "status": "processing",
        "video_url": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "error": None,
        "shared": False,
        "likes": 0,
        "views": 0,
        "shares": 0,
        "user_id": user_id,
        "notify_email": request.notify_email
    }
    
    await db.videos.insert_one(video_doc)
    
    background_tasks.add_task(
        generate_video_task,
        video_id,
        request.prompt,
        request.model,
        request.size,
        request.duration
    )
    
    return VideoResponse(**video_doc)

@api_router.post("/videos/batch-generate")
async def batch_generate_videos(request: BatchVideoRequest, background_tasks: BackgroundTasks):
    """Generate multiple videos at once"""
    video_ids = []
    
    for video_request in request.videos:
        video_id = str(uuid.uuid4())
        
        video_doc = {
            "id": video_id,
            "prompt": video_request.prompt,
            "model": video_request.model,
            "size": video_request.size,
            "duration": video_request.duration,
            "status": "processing",
            "video_url": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "error": None,
            "shared": False,
            "likes": 0,
            "views": 0,
            "shares": 0,
            "user_id": "default_user"
        }
        
        await db.videos.insert_one(video_doc)
        video_ids.append(video_id)
        
        background_tasks.add_task(
            generate_video_task,
            video_id,
            video_request.prompt,
            video_request.model,
            video_request.size,
            video_request.duration
        )
    
    return {"message": f"Batch generation started for {len(video_ids)} videos", "video_ids": video_ids}

@api_router.get("/videos/{video_id}", response_model=VideoResponse)
async def get_video_status(video_id: str):
    """Get video generation status"""
    video = await db.videos.find_one({"id": video_id}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return VideoResponse(**video)

@api_router.get("/videos/{video_id}/download")
async def download_video(video_id: str):
    """Download generated video"""
    video = await db.videos.find_one({"id": video_id}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    if video["status"] != "completed":
        raise HTTPException(status_code=400, detail="Video is not ready for download")
    
    # Increment view count
    await db.videos.update_one({"id": video_id}, {"$inc": {"views": 1}})
    await db.analytics.update_one(
        {"video_id": video_id},
        {"$inc": {"views": 1}, "$push": {"view_history": datetime.now(timezone.utc).isoformat()}}
    )
    
    video_path = VIDEO_OUTPUT_DIR / f"{video_id}.mp4"
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")
    
    return FileResponse(
        path=str(video_path),
        media_type="video/mp4",
        filename=f"video_{video_id}.mp4"
    )

@api_router.get("/videos", response_model=VideoHistory)
async def get_videos(page: int = 0, limit: int = 20):
    """Get all videos history with pagination"""
    videos = await db.videos.find({}, {"_id": 0}).sort("created_at", -1).skip(page * limit).limit(limit).to_list(limit)
    return VideoHistory(videos=[VideoResponse(**v) for v in videos])

@api_router.post("/videos/{video_id}/share")
async def share_video(video_id: str, request: ShareVideoRequest):
    """Share video to community gallery"""
    video = await db.videos.find_one({"id": video_id}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    if video["status"] != "completed":
        raise HTTPException(status_code=400, detail="Video must be completed to share")
    
    await db.videos.update_one(
        {"id": video_id},
        {"$set": {"shared": request.share_to_gallery}}
    )
    
    if request.share_to_gallery:
        await db.videos.update_one({"id": video_id}, {"$inc": {"shares": 1}})
        await db.analytics.update_one({"video_id": video_id}, {"$inc": {"shares": 1}})
    
    return {"message": "Video shared to gallery" if request.share_to_gallery else "Video removed from gallery"}

@api_router.get("/gallery", response_model=VideoHistory)
async def get_gallery(page: int = 0, limit: int = 20):
    """Get all shared videos in community gallery with pagination"""
    videos = await db.videos.find({"shared": True, "status": "completed"}, {"_id": 0}).sort("created_at", -1).skip(page * limit).limit(limit).to_list(limit)
    return VideoHistory(videos=[VideoResponse(**v) for v in videos])

@api_router.post("/videos/{video_id}/like")
async def like_video(video_id: str):
    """Like a video in the gallery"""
    result = await db.videos.update_one(
        {"id": video_id},
        {"$inc": {"likes": 1}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Video not found")
    
    await db.analytics.update_one({"video_id": video_id}, {"$inc": {"likes": 1}})
    
    video = await db.videos.find_one({"id": video_id}, {"_id": 0})
    return {"likes": video.get("likes", 0)}

@api_router.get("/videos/{video_id}/analytics", response_model=VideoAnalytics)
async def get_video_analytics(video_id: str):
    """Get analytics for a specific video"""
    analytics = await db.analytics.find_one({"video_id": video_id}, {"_id": 0})
    if not analytics:
        raise HTTPException(status_code=404, detail="Analytics not found")
    
    # Calculate engagement rate
    views = analytics.get("views", 0)
    likes = analytics.get("likes", 0)
    shares = analytics.get("shares", 0)
    
    engagement_rate = ((likes + shares * 2) / views * 100) if views > 0 else 0
    analytics["engagement_rate"] = round(engagement_rate, 2)
    
    return VideoAnalytics(**analytics)

@api_router.get("/analytics/overview")
async def get_analytics_overview():
    """Get overall analytics overview"""
    total_videos = await db.videos.count_documents({})
    completed_videos = await db.videos.count_documents({"status": "completed"})
    shared_videos = await db.videos.count_documents({"shared": True})
    
    # Aggregate all analytics
    pipeline = [
        {"$group": {
            "_id": None,
            "total_views": {"$sum": "$views"},
            "total_likes": {"$sum": "$likes"},
            "total_shares": {"$sum": "$shares"}
        }}
    ]
    
    result = await db.analytics.aggregate(pipeline).to_list(1)
    stats = result[0] if result else {"total_views": 0, "total_likes": 0, "total_shares": 0}
    
    return {
        "total_videos": total_videos,
        "completed_videos": completed_videos,
        "shared_videos": shared_videos,
        "total_views": stats.get("total_views", 0),
        "total_likes": stats.get("total_likes", 0),
        "total_shares": stats.get("total_shares", 0),
        "avg_engagement": round((stats.get("total_likes", 0) + stats.get("total_shares", 0) * 2) / max(stats.get("total_views", 1), 1) * 100, 2)
    }

@api_router.post("/videos/{video_id}/schedule")
async def schedule_video_post(video_id: str, request: ScheduleVideoRequest):
    """Schedule a video to be posted to social media"""
    video = await db.videos.find_one({"id": video_id}, {"_id": 0})
    if not video or video["status"] != "completed":
        raise HTTPException(status_code=400, detail="Video must be completed to schedule")
    
    schedule_doc = {
        "id": str(uuid.uuid4()),
        "video_id": video_id,
        "scheduled_time": request.scheduled_time,
        "platforms": request.platforms,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.scheduled_posts.insert_one(schedule_doc)
    return {"message": "Video scheduled successfully", "schedule_id": schedule_doc["id"]}

@api_router.get("/scheduled-posts")
async def get_scheduled_posts():
    """Get all scheduled posts"""
    posts = await db.scheduled_posts.find({}, {"_id": 0}).sort("scheduled_time", 1).to_list(100)
    return {"scheduled_posts": posts}

@api_router.delete("/scheduled-posts/{schedule_id}")
async def cancel_scheduled_post(schedule_id: str):
    """Cancel a scheduled post"""
    result = await db.scheduled_posts.delete_one({"id": schedule_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Scheduled post not found")
    return {"message": "Scheduled post cancelled"}

@api_router.get("/team")
async def get_team_members():
    """Get team members"""
    members = await db.team_members.find({}, {"_id": 0}).to_list(100)
    return {"team_members": members}

@api_router.post("/team/invite")
async def invite_team_member(name: str, email: str, role: str = "member"):
    """Invite a team member"""
    member_id = str(uuid.uuid4())
    
    member_doc = {
        "id": member_id,
        "name": name,
        "email": email,
        "role": role,
        "joined_at": datetime.now(timezone.utc).isoformat(),
        "status": "invited"
    }
    
    await db.team_members.insert_one(member_doc)
    return {"message": "Team member invited", "member": member_doc}

@api_router.delete("/team/{member_id}")
async def remove_team_member(member_id: str):
    """Remove a team member"""
    result = await db.team_members.delete_one({"id": member_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Team member not found")
    return {"message": "Team member removed"}

@api_router.delete("/videos/{video_id}")
async def delete_video(video_id: str):
    """Delete a video"""
    result = await db.videos.delete_one({"id": video_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Delete analytics
    await db.analytics.delete_one({"video_id": video_id})
    
    video_path = VIDEO_OUTPUT_DIR / f"{video_id}.mp4"
    if video_path.exists():
        video_path.unlink()
    
    return {"message": "Video deleted successfully"}

# ============================================================
# INTEGRATION APIs - Cross-App Communication
# ============================================================

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: str
    affiliate_link: str
    price: float = 0.0
    category: str = "General"
    image_url: Optional[str] = None
    promo_video_ids: List[str] = []
    status: str = "draft"
    store_listed: bool = False
    created_at: str
    updated_at: str

class CreateProductRequest(BaseModel):
    name: str
    description: str
    affiliate_link: str
    price: float = 0.0
    category: str = "General"
    image_url: Optional[str] = None

class UpdateProductRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    affiliate_link: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    status: Optional[str] = None

class IntegrationKey(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    app_name: str
    api_key: str
    permissions: List[str]
    created_at: str

class CreateKeyRequest(BaseModel):
    app_name: str
    permissions: List[str] = ["read_products", "read_videos"]

# --- API Key Verification ---
async def verify_integration_key(x_api_key: str = Header(None)):
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header")
    key_doc = await db.integration_keys.find_one({"api_key": x_api_key}, {"_id": 0})
    if not key_doc:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return key_doc

# --- Integration Key Management ---
@api_router.post("/integration/keys", response_model=IntegrationKey)
async def create_integration_key(request: CreateKeyRequest):
    """Generate an API key for another app to connect"""
    key_id = str(uuid.uuid4())
    api_key = f"ezad-{uuid.uuid4().hex[:24]}"
    
    key_doc = {
        "id": key_id,
        "app_name": request.app_name,
        "api_key": api_key,
        "permissions": request.permissions,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.integration_keys.insert_one(key_doc)
    return IntegrationKey(**key_doc)

@api_router.get("/integration/keys")
async def list_integration_keys():
    """List all integration API keys"""
    keys = await db.integration_keys.find({}, {"_id": 0}).to_list(50)
    return {"keys": keys}

@api_router.delete("/integration/keys/{key_id}")
async def revoke_integration_key(key_id: str):
    """Revoke an API key"""
    result = await db.integration_keys.delete_one({"id": key_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Key not found")
    return {"message": "API key revoked"}

# --- Product Catalog ---
@api_router.get("/products")
async def list_products():
    """List all affiliate products"""
    products = await db.products.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"products": products}

@api_router.post("/products", response_model=Product)
async def create_product(request: CreateProductRequest):
    """Add an affiliate product"""
    product_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    product_doc = {
        "id": product_id,
        "name": request.name,
        "description": request.description,
        "affiliate_link": request.affiliate_link,
        "price": request.price,
        "category": request.category,
        "image_url": request.image_url,
        "promo_video_ids": [],
        "status": "draft",
        "store_listed": False,
        "created_at": now,
        "updated_at": now
    }
    await db.products.insert_one(product_doc)
    return Product(**product_doc)

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    """Get a single product with its promo videos"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Attach video details
    videos = []
    for vid_id in product.get("promo_video_ids", []):
        video = await db.videos.find_one({"id": vid_id, "status": "completed"}, {"_id": 0})
        if video:
            videos.append(video)
    product["promo_videos"] = videos
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, request: UpdateProductRequest):
    """Update a product"""
    updates = {k: v for k, v in request.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.products.update_one({"id": product_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    return Product(**product)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    """Delete a product"""
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

@api_router.post("/products/{product_id}/link-video")
async def link_video_to_product(product_id: str, video_id: str):
    """Link a generated video to a product"""
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    video = await db.videos.find_one({"id": video_id})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    await db.products.update_one(
        {"id": product_id},
        {
            "$addToSet": {"promo_video_ids": video_id},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    return {"message": f"Video linked to product '{product['name']}'"}

@api_router.post("/products/{product_id}/publish")
async def publish_product_to_store(product_id: str):
    """Publish a product so the store can display it"""
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await db.products.update_one(
        {"id": product_id},
        {"$set": {
            "status": "active",
            "store_listed": True,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": f"Product '{product['name']}' published to store"}

@api_router.post("/products/{product_id}/unpublish")
async def unpublish_product(product_id: str):
    """Remove a product from the store"""
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": {
            "store_listed": False,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product removed from store"}

# --- Store Feed (Public - for amhere4utoday.com to consume) ---
@api_router.get("/store/feed")
async def get_store_feed():
    """Public feed of published products for the store to display.
    Your store app calls this endpoint to get all active products."""
    products = await db.products.find(
        {"store_listed": True, "status": "active"}, {"_id": 0}
    ).sort("updated_at", -1).to_list(200)
    
    # Enrich with video download URLs
    for product in products:
        videos = []
        for vid_id in product.get("promo_video_ids", []):
            video = await db.videos.find_one({"id": vid_id, "status": "completed"}, {"_id": 0})
            if video:
                videos.append({
                    "id": video["id"],
                    "prompt": video.get("prompt", ""),
                    "video_url": video.get("video_url", ""),
                    "duration": video.get("duration", 4),
                    "size": video.get("size", "1280x720")
                })
        product["promo_videos"] = videos
    
    return {"products": products, "count": len(products)}

@api_router.get("/store/feed/{product_id}")
async def get_store_product(product_id: str):
    """Get a single published product for the store"""
    product = await db.products.find_one(
        {"id": product_id, "store_listed": True}, {"_id": 0}
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found in store")
    
    videos = []
    for vid_id in product.get("promo_video_ids", []):
        video = await db.videos.find_one({"id": vid_id, "status": "completed"}, {"_id": 0})
        if video:
            videos.append({
                "id": video["id"],
                "prompt": video.get("prompt", ""),
                "video_url": video.get("video_url", ""),
                "duration": video.get("duration", 4),
                "size": video.get("size", "1280x720")
            })
    product["promo_videos"] = videos
    return product

# --- External Integration Endpoints (secured with API key) ---
@api_router.get("/external/products")
async def external_list_products(key: dict = Depends(verify_integration_key)):
    """For Affiliate Pro to read products (requires API key)"""
    if "read_products" not in key.get("permissions", []):
        raise HTTPException(status_code=403, detail="Missing read_products permission")
    products = await db.products.find({}, {"_id": 0}).to_list(200)
    return {"products": products}

@api_router.get("/external/videos")
async def external_list_videos(key: dict = Depends(verify_integration_key)):
    """For Affiliate Pro to read videos (requires API key)"""
    if "read_videos" not in key.get("permissions", []):
        raise HTTPException(status_code=403, detail="Missing read_videos permission")
    videos = await db.videos.find({"status": "completed"}, {"_id": 0}).to_list(200)
    return {"videos": videos}

@api_router.post("/external/products")
async def external_create_product(request: CreateProductRequest, key: dict = Depends(verify_integration_key)):
    """For Affiliate Pro to push products (requires API key)"""
    if "write_products" not in key.get("permissions", []):
        raise HTTPException(status_code=403, detail="Missing write_products permission")
    
    product_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    product_doc = {
        "id": product_id,
        "name": request.name,
        "description": request.description,
        "affiliate_link": request.affiliate_link,
        "price": request.price,
        "category": request.category,
        "image_url": request.image_url,
        "promo_video_ids": [],
        "status": "active",
        "store_listed": True,
        "created_at": now,
        "updated_at": now,
        "source": key.get("app_name", "external")
    }
    await db.products.insert_one(product_doc)
    return {"id": product_id, "message": "Product created and listed in store"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()