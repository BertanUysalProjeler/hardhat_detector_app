from fastapi import FastAPI, UploadFile, File, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import shutil
from app.db import init_db, SessionLocal
from app.models import Video
from app.worker import start_video_processing
from app.ws_manager import ws_manager
from app.config import UPLOAD_DIR
import uuid

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database and upload folder
    init_db()
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    yield

app = FastAPI(lifespan=lifespan)

# Allow frontend (React) to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # TODO: restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload/")
async def upload_video(file: UploadFile = File(...)):
    """
    Save uploaded video, create DB entry, and start processing.
    """
    try:
        # Ensure a unique stored filename to avoid DB unique constraint collisions
        original_name = file.filename or f"upload_{uuid.uuid4().hex}.mp4"
        safe_name = original_name.replace("/", "_").replace("\\", "_")
        unique_name = f"{uuid.uuid4().hex}_{safe_name}"

        video_path = os.path.join(UPLOAD_DIR, unique_name)
        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Create DB record with the unique stored name
        db = SessionLocal()
        new_video = Video(filename=unique_name)
        db.add(new_video)
        db.commit()
        db.refresh(new_video)

        # Do NOT start detection here; wait for explicit start request
        return {"message": "✅ Video uploaded", "video_id": new_video.id, "filename": unique_name}
    except Exception as e:
        # Surface the error message to help diagnose 500s during local testing
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.post("/start/{video_id}")
async def start_processing(video_id: int):
    """
    Explicitly start processing an already uploaded video by id.
    """
    db = SessionLocal()
    try:
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        video_path = os.path.join(UPLOAD_DIR, video.filename)
        if not os.path.exists(video_path):
            raise HTTPException(status_code=404, detail="Stored video file missing")
        start_video_processing(video_path, video_id)
        return {"message": "▶️ Processing started", "video_id": video_id}
    finally:
        db.close()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for pushing detection results.
    """
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep alive, we don’t expect messages from frontend
            await websocket.receive_text()
    except Exception:
        pass
    finally:
        ws_manager.disconnect(websocket)
