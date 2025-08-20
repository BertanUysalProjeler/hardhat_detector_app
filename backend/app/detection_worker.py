# backend/app/detection_worker.py
import cv2
import base64
from typing import List, Dict
from app.ws_manager import ws_manager
from app.db import SessionLocal
from app.models import Detection
from app.model.torch_model import load_yolo_model

# load YOLO once per process
_model = load_yolo_model()

CLASS_NAMES = {0: "no hard hat", 1: "hard hat"}

def _draw_and_collect(frame, results) -> Dict[str, any]:
    """
    Draw boxes on frame and collect detection metadata.
    Returns: {"detections": [...], "no_helmet_count": int, "frame": <np.ndarray>}
    """
    detections: List[Dict] = []
    no_helmet_count = 0

    for r in results:
        # r.boxes is a Boxes object; iterate each
        for box in r.boxes:
            cls = int(box.cls)
            conf = float(box.conf)
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            label = CLASS_NAMES.get(cls, str(cls))

            if label == "no hard hat":
                no_helmet_count += 1

            # draw
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, f"{label} {conf:.2f}", (x1, y1 - 8),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

            detections.append({
                "label": label,
                "confidence": round(conf, 3),
                "bbox": [x1, y1, x2, y2]
            })

    return {"detections": detections, "no_helmet_count": no_helmet_count, "frame": frame}

def detection_worker(video_path: str, video_id: int):
    """
    Run YOLO on a video, stream annotated frames + counts via WS,
    and store detections to DB.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"❌ Could not open video: {video_path}")
        return

    db = SessionLocal()
    frame_idx = 0
    # Read FPS once for synchronization on frontend
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # YOLO inference
            results = _model(frame, verbose=False)

            # draw + collect
            out = _draw_and_collect(frame, results)
            detections = out["detections"]
            no_helmet_count = out["no_helmet_count"]
            annotated = out["frame"]

            # persist detections (you can filter if you only want "no hard hat")
            for det in detections:
                db.add(Detection(
                    video_id=video_id,
                    frame_number=frame_idx,
                    label=det["label"],
                    confidence=str(det["confidence"]),
                ))

            # encode frame → base64
            ok, buf = cv2.imencode(".jpg", annotated)
            if ok:
                b64 = base64.b64encode(buf).decode("utf-8")
                # thread-safe WS broadcast
                ws_manager.broadcast({
                    "video_id": video_id,
                    "frame_index": frame_idx,
                    "fps": fps,
                    "noHelmetCount": no_helmet_count,
                    "detections": detections,
                    "frame": b64,  # base64 JPEG
                })

            frame_idx += 1

            # commit in batches for performance (every ~20 frames)
            if frame_idx % 20 == 0:
                db.commit()

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[ERROR] detection_worker: {e}")
    finally:
        db.close()
        cap.release()