## Hardhat Detector

Real-time hardhat/no-hardhat detection with a FastAPI backend (YOLOv8) and an Electron + React desktop frontend. Supports local dev, packaged desktop app, and Dockerized backend.

### Features
- Upload a video from the desktop app
- Start processing on demand (Start Processing button)
- Live, annotated frames via WebSocket
- Persist detections to SQLite
- Packaged Windows installer via electron-builder

### Repository Structure
```
hardhat-detector/
  backend/
    app/
      config.py           # paths, DB, upload dir, model path (env override supported)
      db.py               # SQLAlchemy engine + init_db()
      detection_worker.py # YOLO inference loop; streams frames over WS
      main.py             # FastAPI app: /upload, /start, /ws
      model/torch_model.py# YOLO model loader uses YOLO_MODEL_PATH
      models.py           # SQLAlchemy models: Video, Detection
      worker.py           # background thread launcher
      ws_manager.py       # thread-safe WebSocket broadcaster
    torch_model/
      README.md          # place best.pt here (excluded from git)
    requirements.txt
    DockerFile           # Docker image for backend

  frontend/
    web/                 # React + Vite app (dev server & build)
    electron/            # Electron app wrapper (packaging config)

  docs/
    TRAIN_COLAB.md       # Google Colab training guide

  package-lock.json
  package.json
  README.md
```

### Prerequisites
- Windows 10/11 (for packaged app steps)
- Python 3.10+ (for backend) and Node 18+ (for frontend/electron)
- GPU optional; CPU works but slower

### Setup (Local Dev)
1) Backend
```powershell
cd backend
py -m venv .venv
 .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Make sure you have a model file:
#   place it at backend/torch_model/best.pt
# or point to it via env var YOLO_MODEL_PATH

uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

2) Frontend (Electron desktop in dev)
```powershell
cd frontend/web
npm install

cd ../electron
npm install
npm run electron:dev
```

Usage:
- Click "Upload Video" → choose a file → you will see "Video uploaded…"
- Click "Start Processing" → right pane shows annotated frames, left shows original

### Packaging the Desktop App (Windows)
Build web assets and then package Electron:
```powershell
cd frontend/web
npm run build

cd ../electron
# Optional: place an icon at frontend/electron/build/icon.ico
npm run electron:pack
```
The installer is created under `frontend/electron/dist`.

Backend must be running (local or Docker). See Docker section below if you prefer Docker.

### Docker (Backend Only)
Build image:
```powershell
cd backend
docker build -f DockerFile -t hardhat-backend:latest .
```
Run container (mount model + data):
```powershell
docker run --rm -p 8000:8000 ^
  -e YOLO_MODEL_PATH=/app/torch_model/best.pt ^
  -v %cd%\torch_model:/app/torch_model:ro ^
  -v %cd%\data:/app/data ^
  hardhat-backend:latest
```

### API
- POST `/upload/` → { video_id, filename }
- POST `/start/{video_id}` → start background processing for that video
- WS `/ws` → broadcasts annotated frames: `{ video_id, frame_index, fps, noHelmetCount, detections[], frame }`

### Environment Variables
- `YOLO_MODEL_PATH`: path to the .pt model (default: `backend/torch_model/best.pt`)

### Dataset
The dataset is large. Only `dataset/data.yaml` is tracked. Place or mount your own `train/`, `valid/`, and `test/` trees matching `data.yaml`.

### Training (Colab)
See `docs/TRAIN_COLAB.md` for a full Google Colab walkthrough that trains a YOLOv8 model and exports `best.pt`.

### Notes
- Uploads and DB are persisted in `backend/data/`; both are excluded from git.
- The Electron app uses `http://127.0.0.1:8000` by default.
- To launch backend automatically with the app, we can extend Electron main to spawn uvicorn; open an issue if you want that.

### License
MIT (or your preference)




