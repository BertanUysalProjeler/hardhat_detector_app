from ultralytics import YOLO
from app.config import YOLO_MODEL_PATH

def load_yolo_model():
    """Load the trained YOLO model."""
    model = YOLO(YOLO_MODEL_PATH)
    return model
