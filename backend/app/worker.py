import threading
from app.detection_worker import detection_worker

def start_video_processing(video_path: str, video_id: int):
    """
    Start detection worker in a background thread.
    """
    thread = threading.Thread(
        target=detection_worker,
        args=(video_path, video_id),
        daemon=True
    )
    thread.start()
    return thread
