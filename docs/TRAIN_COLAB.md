# Train YOLOv8 for Hardhat Detection (Google Colab)

This guide walks you through training a YOLOv8 model for detecting "hard hat" vs "no hard hat" using your dataset. It assumes the dataset follows the structure in `dataset/data.yaml`.

## 1) Open a Colab Notebook
- Go to Google Colab and start a new notebook.
- Runtime → Change runtime type → GPU (T4/any available).

## 2) Setup and Install
```python
!nvidia-smi
!pip install ultralytics==8.2.0
from google.colab import drive
drive.mount('/content/drive')
```

## 3) Bring Your Dataset to Colab
- Option A: Copy from Google Drive
```python
!mkdir -p /content/hardhat-detector/dataset
# Example: replace with your Drive path
!cp -r /content/drive/MyDrive/hardhat-detector/dataset/* /content/hardhat-detector/dataset/
!ls -R /content/hardhat-detector/dataset | head -n 100
```
- Ensure paths in `data.yaml` are correct relative to where you run training. For Colab, you can rewrite them:
```python
import yaml, os
cfg_path = '/content/hardhat-detector/dataset/data.yaml'
with open(cfg_path, 'r') as f:
    cfg = yaml.safe_load(f)
root = '/content/hardhat-detector/dataset'
for k in ('train','val','test'):
    if k in cfg and not os.path.isabs(cfg[k]):
        cfg[k] = os.path.join(root, cfg[k].replace('../',''))
with open(cfg_path, 'w') as f:
    yaml.safe_dump(cfg, f)
print(cfg)
```

## 4) Train YOLOv8
```python
from ultralytics import YOLO

# 2 classes: ['no-helmet','helmet'] per your data.yaml
model = YOLO('yolov8n.pt')  # try yolov8s.pt for better accuracy
results = model.train(
    data='/content/hardhat-detector/dataset/data.yaml',
    imgsz=640,
    epochs=50,
    batch=16,
    device=0,  # GPU
    project='/content/hardhat-runs',
    name='exp',
)
```

## 5) Evaluate and Export Best Model
```python
best = '/content/hardhat-runs/exp/weights/best.pt'
print('Best model at:', best)
# Optional validation
model = YOLO(best)
metrics = model.val(data='/content/hardhat-detector/dataset/data.yaml')
print(metrics)
```

## 6) Download `best.pt`
```python
from google.colab import files
files.download(best)
```
- Place `best.pt` at `backend/torch_model/best.pt` in your repo (or set `YOLO_MODEL_PATH`).

## 7) Tips
- Increase `epochs` or switch to `yolov8s.pt`/larger models for better accuracy.
- Reduce `batch` if you hit memory limits.
- Balance classes if one is underrepresented.

## 8) Quick Inference Test (Optional)
```python
from ultralytics import YOLO
import numpy as np

model = YOLO(best)
img = np.zeros((640,640,3), dtype=np.uint8)
res = model(img)[0]
print('Detections:', res)
```

