import os

# Base project directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Directory for uploaded videos
UPLOAD_DIR = os.path.join(BASE_DIR, "..", "data", "uploads")

# Database file
DB_PATH = os.path.join(BASE_DIR, "..", "data", "app.db")

# YOLO model path (default best model). Allow override via env var.
# The default points to backend/torch_model/best.pt
YOLO_MODEL_PATH = os.getenv(
    "YOLO_MODEL_PATH",
    os.path.join(BASE_DIR, "..", "torch_model", "best.pt"),
)

# Make sure folders exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
