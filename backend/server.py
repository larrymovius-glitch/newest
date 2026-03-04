from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks, UploadFile, File, Depends
from fastapi.responses import FileResponse
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

sys.path.insert(0, os.path.abspath(''))
from emergentintegrations.llm.openai.video_generation import OpenAIVideoGeneration

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

VIDEO_OUTPUT_DIR = Path("/app/backend/generated_videos")
VIDEO_OUTPUT_DIR.mkdir(exist_ok=True)

class VideoRequest(BaseModel):
    prompt: str
    model: str = "sora-2"
    size: str = "1280x720"
    duration: int = 4
    add_voiceover: bool = False
    voiceover_text: Optional[str] = None

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

async def generate_video_task(video_id: str, prompt: str, model: str, size: str, duration: int):
    """Background task to generate video"""
    try:
        video_gen = OpenAIVideoGeneration(api_key=os.environ['EMERGENT_LLM_KEY'])
        output_path = str(VIDEO_OUTPUT_DIR / f"{video_id}.mp4")
        
        video_bytes = video_gen.text_to_video(
            prompt=prompt,
            model=model,
            size=size,
            duration=duration,
            max_wait_time=900
        )
        
        if video_bytes:
            video_gen.save_video(video_bytes, output_path)
            await db.videos.update_one(
                {"id": video_id},
                {"$set": {
                    "status": "completed",
                    "video_url": f"/api/videos/{video_id}/download"
                }}
            )
            
            # Initialize analytics
            await db.analytics.insert_one({
                "video_id": video_id,
                "views": 0,
                "likes": 0,
                "shares": 0,
                "view_history": [],
                "engagement_rate": 0.0
            })
            
            logging.info(f"Video {video_id} generated successfully")
        else:
            await db.videos.update_one(
                {"id": video_id},
                {"$set": {
                    "status": "failed",
                    "error": "Video generation returned empty result"
                }}
            )
    except Exception as e:
        logging.error(f"Video generation failed for {video_id}: {str(e)}")
        await db.videos.update_one(
            {"id": video_id},
            {"$set": {
                "status": "failed",
                "error": str(e)
            }}
        )

@api_router.get("/")
async def root():
    return {"message": "Affiliate Pro Video Generator API"}

@api_router.get("/templates", response_model=List[Template])
async def get_templates():
    """Get all video templates including custom ones"""
    custom_templates = await db.templates.find({}, {"_id": 0}).to_list(100)
    all_templates = [Template(**t) for t in TEMPLATES] + [Template(**t) for t in custom_templates]
    return all_templates

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
async def generate_video(request: VideoRequest, background_tasks: BackgroundTasks):
    """Generate a video from text prompt"""
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
        "user_id": "default_user"
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
async def get_videos():
    """Get all videos history"""
    videos = await db.videos.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
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
async def get_gallery():
    """Get all shared videos in community gallery"""
    videos = await db.videos.find({"shared": True, "status": "completed"}, {"_id": 0}).sort("created_at", -1).to_list(100)
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