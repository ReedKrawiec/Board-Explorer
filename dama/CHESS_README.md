# Chess Board Data Generation with DaMa

This directory contains the setup for generating synthetic chess board training data for YOLO11 using DaMa (Data Manipulator).

## Quick Start

### 1. Install Dependencies

```bash
cd dama
pip install -r requirements.txt
```

### 2. Generate Background Images (Already Done)

100 background images have been generated. To create more:

```bash
python3 generate_backgrounds.py
```

This creates diverse backgrounds in `chess_input/`:
- Dark backgrounds (chess streams)
- Light backgrounds (websites)
- Textured and patterned backgrounds
- Gradient backgrounds

### 3. Generate Chess Board Dataset

```bash
# Generate dataset with bounding box visualizations
python3 dama.py --config chess-config.json --draw-labels

# Or without visualizations (faster)
python3 dama.py --config chess-config.json
```

Output goes to `chess_output/`:
```
chess_output/
├── train/
│   ├── images/     # Training images (512x512 PNG)
│   ├── labels/     # YOLO format labels (.txt)
├── val/
│   ├── images/     # Validation images
│   ├── labels/     # Validation labels
├── classes.txt     # Class names
└── data.yaml       # YOLO dataset config
```

### 4. Scale Up for Production

For YOLO11 training, generate 10,000+ images:

```bash
# Generate more backgrounds (adjust NUM_BACKGROUNDS in script)
python3 generate_backgrounds.py  # Edit to set NUM_BACKGROUNDS=1000

# Run DaMa multiple times or adjust config
# Each run processes all backgrounds
python3 dama.py --config chess-config.json
```

## Chess Provider Features

The chess board provider (`providers/chess/def.py`) generates diverse training data:

### Board Variety
- **9 color schemes**: wood, light_wood, dark_wood, green, blue, marble, tournament, gray, brown
- **Borders**: With or without border decorations
- **Sizes**: 320-448 pixels (random for scale diversity)

### Piece Variety
- **3 rendering styles**:
  - Classic: Traditional piece shapes
  - Modern: Flat, minimalist circles
  - Minimalist: Simple geometric shapes

### Position Variety
- **10 preset positions**: Starting, mid-game, endgames
- **Random positions**: 4-32 pieces placed randomly
- **Piece distribution**: Both sparse and dense boards

### Augmentations
- **Brightness**: 0.8x to 1.2x random variations
- **Rotation**: Slight angles (-15° to +15°) for perspective variety
- **Placement**: Random positioning within 512x512 frame

## Dataset Format

### Classes (13 total)
```
0: BOARD      # Full chess board bounding box
1: p          # Black pawn
2: r          # Black rook
3: n          # Black knight
4: b          # Black bishop
5: q          # Black queen
6: k          # Black king
7: P          # White Pawn
8: R          # White Rook
9: N          # White Knight
10: B         # White Bishop
11: Q         # White Queen
12: K         # White King
```

### Label Format (YOLO)
Each line in a label file:
```
<class_id> <center_x> <center_y> <width> <height>
```
All values normalized to 0-1 range.

Example:
```
0 0.5 0.5 0.8 0.8          # BOARD at center, 80% of image
7 0.25 0.25 0.05 0.05      # White Pawn
1 0.75 0.75 0.05 0.05      # Black pawn
```

## Configuration

Edit `chess-config.json` to adjust:

```json
{
  "providers": [{
    "name": "chess",
    "min": 1,
    "max": 2,              // range(1, 2) = 1 board per image
    "probability": 1.0,     // 100% chance
    "overlap": false,       // No overlapping boards
    "position": {
      "x": { "min": 0, "max": 600 },
      "y": { "min": 0, "max": 600 }
    }
  }],
  "output": {
    "width": 512,
    "height": 512,
    "distribution": {
      "train": 0.85,        // 85% training
      "val": 0.15           // 15% validation
    }
  }
}
```

## Verification

Check generated data:

```bash
# Count images
ls chess_output/train/images/*.png | wc -l
ls chess_output/val/images/*.png | wc -l

# View sample label
cat chess_output/train/labels/0.txt

# Check classes
cat chess_output/classes.txt
```

## Next Steps

After generating sufficient data (10,000+ images recommended):

1. Follow `docs/PHASE2_YOLO11_CHESS_TRAINING.md` to train YOLO11
2. Use the generated `chess_output/data.yaml` in your training script
3. Expected training time: 2-4 hours with GPU, 10-15 hours with CPU
4. Target metrics: 94-96% mAP50

## Troubleshooting

### Empty label files
- Check that `max` > `min` in provider config (should be `"max": 2` not `"max": 1`)
- Verify position constraints allow board placement
- Run `python3 test_provider.py` to test provider directly

### No validation images
- Increase number of background images
- Check distribution percentages in config
- Ensure enough images for split (min ~100 backgrounds)

### Board too small/large
- Edit `board_size` range in `providers/chess/def.py`
- Current: `random.randint(320, 448)`
- Adjust based on detection requirements

## Resources

- Original DaMa: https://github.com/ReedKrawiec/DaMa
- YOLO11 docs: https://docs.ultralytics.com/models/yolo11/
- Training guide: `../docs/PHASE2_YOLO11_CHESS_TRAINING.md`
