from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
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
from datetime import datetime, timezone
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

class VideoHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    videos: List[VideoResponse]

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
        "error": None
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

@api_router.delete("/videos/{video_id}")
async def delete_video(video_id: str):
    """Delete a video"""
    result = await db.videos.delete_one({"id": video_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Video not found")
    
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