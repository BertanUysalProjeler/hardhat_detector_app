from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .db import Base

class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, unique=True, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    detections = relationship("Detection", back_populates="video")

class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    frame_number = Column(Integer, nullable=False)
    label = Column(String, nullable=False)
    confidence = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    video = relationship("Video", back_populates="detections")
