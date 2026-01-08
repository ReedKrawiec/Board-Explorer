# Phase 2: Training YOLO11 on Chess Board Dataset

## Overview
Train YOLO11 nano model on your chess board + piece detection dataset. This replaces your current YOLOv5 model (84MB) with a smaller, faster YOLO11 model (5-10MB).

---

## Prerequisites

✅ Phase 1 complete: 10,000+ chess board images generated
✅ Dataset at: `~/workspace/DaMa/output/chess_yolo11_dataset/`
✅ Python 3.8+ installed
✅ (Optional) NVIDIA GPU with CUDA for faster training

---

## Step 1: Environment Setup

### 1.1 Create Training Environment

```bash
# Navigate to workspace
cd ~/workspace

# Create training directory
mkdir yolo11_chess_training
cd yolo11_chess_training

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 1.2 Install Ultralytics YOLO11

```bash
# Install latest ultralytics (includes YOLO11)
pip install ultralytics

# Install PyTorch
pip install torch torchvision

# For GPU support (if you have NVIDIA GPU):
# pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# Verify installation
yolo version
python3 -c "from ultralytics import YOLO; print('YOLO11 ready!')"
```

### 1.3 Verify Dataset

```bash
# Check dataset structure
ls ~/workspace/DaMa/output/chess_yolo11_dataset/

# Should see:
# train/images/  train/labels/  val/images/  val/labels/  chess.yaml

# Count images
echo "Training images: $(ls ~/workspace/DaMa/output/chess_yolo11_dataset/train/images/*.jpg 2>/dev/null | wc -l)"
echo "Validation images: $(ls ~/workspace/DaMa/output/chess_yolo11_dataset/val/images/*.jpg 2>/dev/null | wc -l)"
```

---

## Step 2: Create Training Script

### 2.1 Create `train_chess_yolo11.py`

```python
#!/usr/bin/env python3
# train_chess_yolo11.py

"""
Train YOLO11 for chess board + piece detection.
13 classes: BOARD + 12 piece types (p,r,n,b,q,k,P,R,N,B,Q,K)
"""

from ultralytics import YOLO
import torch
from pathlib import Path

def train_chess_detector():
    """Train YOLO11 nano model for chess board detection."""

    # Configuration
    CONFIG = {
        'model': 'yolo11n.pt',  # Nano model (smallest, fastest for browser)
        'data': str(Path.home() / 'workspace/DaMa/output/chess_yolo11_dataset/chess.yaml'),
        'epochs': 150,  # More epochs for 13 classes
        'imgsz': 512,   # Match your synthetic data size
        'batch': 16,    # Adjust based on GPU memory
        'device': 'cpu',  # 'cpu' or '0' for GPU
        'workers': 4,
        'patience': 50,  # Early stopping
        'save': True,
        'save_period': 10,
        'cache': False,  # Set True to cache images in RAM (faster but more memory)
        'optimizer': 'AdamW',
        'lr0': 0.001,    # Initial learning rate
        'lrf': 0.01,     # Final learning rate
        'momentum': 0.937,
        'weight_decay': 0.0005,
        'warmup_epochs': 3,
        'project': 'runs/chess',
        'name': 'yolo11n_chess',
        'exist_ok': False,
        'pretrained': True,
        'verbose': True,
        'plots': True,   # Generate training plots
    }

    # Auto-detect device
    device = CONFIG['device']
    if device != 'cpu':
        if torch.cuda.is_available():
            device = '0'
            print(f"✅ Using GPU: {torch.cuda.get_device_name(0)}")
            CONFIG['batch'] = 32  # Larger batch for GPU
        elif torch.backends.mps.is_available():
            device = 'mps'
            print("✅ Using Mac MPS (Metal)")
        else:
            device = 'cpu'
            print("⚠️  No GPU detected, using CPU (training will be slower)")
            CONFIG['batch'] = 8  # Smaller batch for CPU
    else:
        print("ℹ️  Using CPU for training")
        CONFIG['batch'] = 8

    CONFIG['device'] = device

    # Load model
    print("\n" + "="*60)
    print("Loading YOLO11 Nano model...")
    print("="*60)

    model = YOLO(CONFIG['model'])

    print(f"\nModel: {CONFIG['model']}")
    print(f"Parameters: {sum(p.numel() for p in model.model.parameters()):,}")
    print(f"Classes: 13 (BOARD + 12 pieces)")

    # Verify dataset
    import os
    if not os.path.exists(CONFIG['data']):
        raise FileNotFoundError(f"Dataset YAML not found: {CONFIG['data']}")

    print(f"\nDataset: {CONFIG['data']}")

    # Start training
    print("\n" + "="*60)
    print("Starting Chess Board Detection Training...")
    print("="*60)
    print(f"Epochs: {CONFIG['epochs']}")
    print(f"Image size: {CONFIG['imgsz']}x{CONFIG['imgsz']}")
    print(f"Batch size: {CONFIG['batch']}")
    print(f"Device: {CONFIG['device']}")
    print(f"Classes: BOARD, p, r, n, b, q, k, P, R, N, B, Q, K")
    print("="*60 + "\n")

    # Train
    results = model.train(
        data=CONFIG['data'],
        epochs=CONFIG['epochs'],
        imgsz=CONFIG['imgsz'],
        batch=CONFIG['batch'],
        device=CONFIG['device'],
        workers=CONFIG['workers'],
        patience=CONFIG['patience'],
        save=CONFIG['save'],
        save_period=CONFIG['save_period'],
        cache=CONFIG['cache'],
        optimizer=CONFIG['optimizer'],
        lr0=CONFIG['lr0'],
        lrf=CONFIG['lrf'],
        momentum=CONFIG['momentum'],
        weight_decay=CONFIG['weight_decay'],
        warmup_epochs=CONFIG['warmup_epochs'],
        project=CONFIG['project'],
        name=CONFIG['name'],
        exist_ok=CONFIG['exist_ok'],
        pretrained=CONFIG['pretrained'],
        verbose=CONFIG['verbose'],
        plots=CONFIG['plots'],
    )

    print("\n" + "="*60)
    print("✅ Training completed!")
    print("="*60)

    # Print results location
    results_dir = Path(CONFIG['project']) / CONFIG['name']
    print(f"\nResults saved to: {results_dir}")
    print(f"Best weights: {results_dir / 'weights/best.pt'}")
    print(f"Last weights: {results_dir / 'weights/last.pt'}")

    # Validate
    print("\n" + "="*60)
    print("Running validation on best model...")
    print("="*60)

    metrics = model.val()

    print("\nFinal Metrics:")
    print(f"  mAP50: {metrics.box.map50:.4f}")
    print(f"  mAP50-95: {metrics.box.map:.4f}")
    print(f"  Precision: {metrics.box.p:.4f}")
    print(f"  Recall: {metrics.box.r:.4f}")

    # Check per-class performance
    print("\nPer-Class mAP50:")
    classes = ["BOARD", "p", "r", "n", "b", "q", "k", "P", "R", "N", "B", "Q", "K"]
    if hasattr(metrics.box, 'ap50'):
        for i, ap in enumerate(metrics.box.ap50):
            print(f"  {classes[i]}: {ap:.4f}")

    return results_dir


if __name__ == "__main__":
    print("\n" + "="*60)
    print("YOLO11 Chess Board Detector Training")
    print("="*60 + "\n")

    try:
        results_dir = train_chess_detector()
        print(f"\n✅ Training successful!")
        print(f"\nNext steps:")
        print(f"  1. Review training plots: {results_dir}/results.png")
        print(f"  2. Test model: python3 test_model.py")
        print(f"  3. Export to ONNX: python3 export_model.py")
    except Exception as e:
        print(f"\n❌ Training failed: {e}")
        import traceback
        traceback.print_exc()
        raise
```

### 2.2 Create Quick Test Script

```python
# test_model.py

from ultralytics import YOLO
from pathlib import Path
import glob

# Load trained model
model_path = 'runs/chess/yolo11n_chess/weights/best.pt'
print(f"Loading model: {model_path}")
model = YOLO(model_path)

# Test on validation images
val_images = glob.glob(str(Path.home() / 'workspace/DaMa/output/chess_yolo11_dataset/val/images/*.jpg'))[:10]

print(f"\nTesting on {len(val_images)} images...")

# Run inference
results = model.predict(val_images, save=True, conf=0.25, imgsz=512)

print(f"\n✅ Predictions saved to: runs/detect/predict/")
print("\nDetection Summary:")
for i, result in enumerate(results):
    boxes = result.boxes
    board_count = sum(1 for box in boxes if int(box.cls[0]) == 0)
    piece_count = sum(1 for box in boxes if int(box.cls[0]) != 0)
    print(f"  Image {i+1}: {board_count} board(s), {piece_count} piece(s)")
```

---

## Step 3: Train the Model

### 3.1 Start Training

```bash
# Activate environment
source venv/bin/activate

# Run training (this will take 1-3 hours with GPU, 4-8 hours with CPU)
python3 train_chess_yolo11.py
```

### 3.2 Monitor Training

Training displays real-time metrics:

```
Epoch   GPU_mem   box_loss   cls_loss   dfl_loss  Instances    Size
  1/150    0.0G      1.234      2.567      1.123       156      512
  2/150    0.0G      1.156      2.398      1.089       162      512
  ...
```

**Key metrics:**
- **box_loss**: Bounding box regression loss (should decrease)
- **cls_loss**: Classification loss (should decrease, important for 13 classes)
- **dfl_loss**: Distribution focal loss (should decrease)
- **mAP50**: Mean average precision at IoU=0.5 (should increase)
- **mAP50-95**: mAP across IoU thresholds (should increase)

### 3.3 View Training Progress

```bash
# Training generates plots in runs/chess/yolo11n_chess/

# View results
open runs/chess/yolo11n_chess/results.png  # Mac
xdg-open runs/chess/yolo11n_chess/results.png  # Linux
start runs/chess/yolo11n_chess/results.png  # Windows
```

**Plots include:**
- Loss curves (box, cls, dfl)
- mAP curves (mAP50, mAP50-95)
- Precision/Recall curves
- Confusion matrix (13x13 for all piece types)
- Example predictions

---

## Step 4: Validate Model

### 4.1 Run Validation

```bash
# Validate best model
yolo detect val \
  model=runs/chess/yolo11n_chess/weights/best.pt \
  data=~/workspace/DaMa/output/chess_yolo11_dataset/chess.yaml \
  imgsz=512
```

### 4.2 Test on Sample Images

```bash
# Run test script
python3 test_model.py

# Check predictions
ls runs/detect/predict/
```

### 4.3 Analyze Per-Class Performance

Create `analyze_results.py`:

```python
# analyze_results.py

from ultralytics import YOLO

model = YOLO('runs/chess/yolo11n_chess/weights/best.pt')
metrics = model.val()

classes = ["BOARD", "p", "r", "n", "b", "q", "k", "P", "R", "N", "B", "Q", "K"]

print("="*60)
print("Per-Class Performance Analysis")
print("="*60)
print(f"{'Class':<8} {'Precision':<12} {'Recall':<12} {'mAP50':<12}")
print("-"*60)

if hasattr(metrics.box, 'ap50'):
    for i in range(13):
        precision = metrics.box.p[i] if hasattr(metrics.box, 'p') else 0
        recall = metrics.box.r[i] if hasattr(metrics.box, 'r') else 0
        map50 = metrics.box.ap50[i] if hasattr(metrics.box, 'ap50') else 0

        print(f"{classes[i]:<8} {precision:>11.4f} {recall:>11.4f} {map50:>11.4f}")

print("-"*60)
print(f"{'Overall':<8} {metrics.box.p:>11.4f} {metrics.box.r:>11.4f} {metrics.box.map50:>11.4f}")
print("="*60)
```

---

## Step 5: Export for Browser

### 5.1 Export to ONNX

```python
# export_onnx.py

from ultralytics import YOLO

# Load trained model
model = YOLO('runs/chess/yolo11n_chess/weights/best.pt')

print("Exporting to ONNX...")
model.export(
    format='onnx',
    imgsz=512,      # Must match training size
    simplify=True,  # Simplify ONNX model
    opset=12,       # ONNX opset version
    dynamic=False,  # Static input shape for browser
)

print("✅ ONNX export complete!")
print("Model: runs/chess/yolo11n_chess/weights/best.onnx")

# Check file size
import os
size_mb = os.path.getsize('runs/chess/yolo11n_chess/weights/best.onnx') / (1024*1024)
print(f"Model size: {size_mb:.2f} MB")

if size_mb < 15:
    print("✅ Good size for browser deployment!")
else:
    print("⚠️  Model is large, consider quantization")
```

### 5.2 Alternative: Export to TensorFlow.js

```python
# export_tfjs.py

from ultralytics import YOLO

model = YOLO('runs/chess/yolo11n_chess/weights/best.pt')

print("Exporting to TensorFlow.js...")
model.export(
    format='tfjs',
    imgsz=512,
)

print("✅ TF.js export complete!")
print("Model: runs/chess/yolo11n_chess/weights/best_web_model/")
```

### 5.3 Verify ONNX Model

```bash
# Test ONNX model loads
python3 << EOF
from ultralytics import YOLO
model = YOLO('runs/chess/yolo11n_chess/weights/best.onnx')
print("✅ ONNX model loads successfully!")

# Get model info
print(f"Input shape: {model.model.get_inputs()[0].shape}")
print(f"Output shape: {model.model.get_outputs()[0].shape}")
EOF
```

---

## Step 6: Optimize Model (Optional)

### 6.1 Quantize to INT8

```python
# quantize_model.py

from ultralytics import YOLO

model = YOLO('runs/chess/yolo11n_chess/weights/best.pt')

print("Exporting with INT8 quantization...")
model.export(
    format='onnx',
    imgsz=512,
    simplify=True,
    int8=True,  # INT8 quantization
)

print("✅ Quantized model saved!")

# Compare sizes
import os
original_size = os.path.getsize('runs/chess/yolo11n_chess/weights/best.onnx') / (1024*1024)
print(f"Size reduction: ~40-50% smaller")
print("Note: Slight accuracy drop (~1-2% mAP)")
```

### 6.2 Test Smaller Image Sizes

If model is still too large, train with smaller images:

```python
# Retrain with 416x416 or 320x320
model = YOLO('yolo11n.pt')
model.train(
    data='chess.yaml',
    imgsz=416,  # Smaller size
    epochs=150,
    # ... other params
)
```

---

## Expected Results

### Target Metrics (After 150 Epochs)

| Metric | Target | Excellent |
|--------|--------|-----------|
| Overall mAP50 | > 0.90 | > 0.95 |
| Overall mAP50-95 | > 0.70 | > 0.80 |
| BOARD detection | > 0.95 | > 0.98 |
| Piece detection | > 0.85 | > 0.92 |
| Precision | > 0.88 | > 0.93 |
| Recall | > 0.85 | > 0.90 |

### Model Specifications

- **Model size (PyTorch)**: ~5 MB
- **Model size (ONNX)**: ~5-6 MB
- **Model size (ONNX INT8)**: ~3-4 MB
- **Parameters**: ~2.5M
- **Compared to YOLOv5**: 10-15x smaller!

### Inference Performance

- **CPU inference**: 10-25ms per frame
- **GPU inference**: 2-5ms per frame
- **Browser (WASM)**: 15-40ms per frame
- **Browser (WebGPU)**: 5-15ms per frame

---

## Troubleshooting

### Issue: Low mAP for pieces (<0.70)

**Causes:**
- Not enough training epochs
- Pieces too small in images
- Class imbalance

**Solutions:**
1. Train for 200+ epochs
2. Increase piece size in DaMa generator
3. Add data augmentation:
```python
model.train(
    ...,
    augment=True,
    mosaic=1.0,
    mixup=0.1,
)
```

### Issue: BOARD detection perfect but pieces poor

**Solution:** Pieces are harder to detect. Try:
1. Adjust loss weights (emphasize piece classes):
```python
model.train(
    ...,
    cls=0.5,  # Classification loss weight
    box=7.5,  # Box loss weight
)
```

2. Use focal loss for hard examples

### Issue: Confusion between similar pieces (rook/bishop)

**Check confusion matrix** in `runs/chess/yolo11n_chess/confusion_matrix.png`

**Solutions:**
1. Make pieces more distinct in DaMa generator
2. Add more training data for confused classes
3. Train longer

### Issue: Model too slow in browser

**Solutions:**
1. Use ONNX INT8 quantization
2. Reduce image size to 416 or 320
3. Use WebGPU backend (5-10x faster)

### Issue: Out of memory during training

**Solutions:**
1. Reduce batch size: `batch=4` or `batch=8`
2. Disable caching: `cache=False`
3. Use smaller model: Try `yolo11n.pt` (already smallest)
4. Reduce workers: `workers=2`

---

## File Structure After Training

```
~/workspace/yolo11_chess_training/
├── venv/
├── train_chess_yolo11.py
├── test_model.py
├── export_onnx.py
├── analyze_results.py
└── runs/
    └── chess/
        └── yolo11n_chess/
            ├── weights/
            │   ├── best.pt          # Best model (PyTorch)
            │   ├── last.pt          # Last epoch
            │   └── best.onnx        # ONNX export for browser
            ├── results.png          # Training curves
            ├── confusion_matrix.png # 13x13 confusion matrix
            ├── F1_curve.png
            ├── PR_curve.png
            ├── P_curve.png
            ├── R_curve.png
            └── args.yaml            # Training config
```

---

## Comparison: YOLOv5 vs YOLO11

| Feature | YOLOv5 (Current) | YOLO11 (New) |
|---------|------------------|--------------|
| Model size | 84 MB | 5-6 MB |
| Parameters | ~20M | ~2.5M |
| mAP50 | ~0.88-0.92 | ~0.92-0.96 |
| Inference (CPU) | 30-50ms | 10-25ms |
| Browser support | TensorFlow.js | ONNX Runtime Web |
| Load time | 3-5s | 1-2s |

**Result: 10-15x smaller, 2x faster!**

---

## Next Steps

✅ **YOLO11 chess detector trained and exported!**

**Model location:** `runs/chess/yolo11n_chess/weights/best.onnx`

**Next:** Proceed to Phase 3 to integrate the ONNX model into your Chrome extension with ONNX Runtime Web.

---

## Quick Reference

```bash
# Train
python3 train_chess_yolo11.py

# Test
python3 test_model.py

# Validate
yolo detect val model=runs/chess/yolo11n_chess/weights/best.pt data=chess.yaml

# Export ONNX
python3 export_onnx.py

# Analyze results
python3 analyze_results.py
```
