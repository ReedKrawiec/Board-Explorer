# Phase 1: Chess Board Data Generation with DaMa

## Overview
Generate synthetic chess board images with piece detection annotations using your DaMa library. This replicates your existing 8000+ image dataset but allows you to create more varied training data for YOLO11.

---

## Understanding Your Current System

**13 Detection Classes:**
```javascript
["BOARD", "p", "r", "n", "b", "q", "k", "P", "R", "N", "B", "Q", "K"]
```

- `BOARD`: The chess board itself (bounding box around entire board)
- `p-k`: Black pieces (pawn, rook, knight, bishop, queen, king)
- `P-K`: White pieces (Pawn, Rook, Knight, Bishop, Queen, King)

**What YOLO Detects:**
- 1 board bounding box per image
- 0-32 piece bounding boxes (for each piece on the board)
- Model converts detections → FEN string → Interactive board

---

## Step 1: Set Up DaMa for Chess Boards

### 1.1 Clone/Update Your DaMa Repository

```bash
# Navigate to workspace
cd ~/workspace

# Clone DaMa if you don't have it
git clone https://github.com/ReedKrawiec/DaMa.git
cd DaMa

# If you already have it
cd DaMa
git pull origin main
```

### 1.2 Install Dependencies

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Verify
python3 dama.py --help
```

---

## Step 2: Chess Board Provider

Your DaMa library likely already has a chess board provider since you generated 8000+ images. Let's check or create an enhanced version:

### 2.1 Check Existing Provider

```bash
# Look for existing chess provider
ls providers/

# If you have a chess provider, you can reuse it!
# Common names: chess, board, chessboard
```

### 2.2 Enhanced Chess Board Provider

Create `providers/chess_yolo11/chess_generator.py`:

```python
# providers/chess_yolo11/chess_generator.py

from PIL import Image, ImageDraw, ImageFont
import random
import os

class ChessBoardProvider:
    """
    Generates synthetic chess board images for YOLO11 training.
    Detects:
    - 1 BOARD (the chess board itself)
    - Up to 32 pieces (p, r, n, b, q, k, P, R, N, B, Q, K)
    """

    def __init__(self, config):
        self.config = config
        self.width = config.get('image_width', 512)
        self.height = config.get('image_height', 512)

        # Class mapping (must match your model)
        self.classes = {
            'BOARD': 0,
            'p': 1, 'r': 2, 'n': 3, 'b': 4, 'q': 5, 'k': 6,  # Black pieces
            'P': 7, 'R': 8, 'N': 9, 'B': 10, 'Q': 11, 'K': 12  # White pieces
        }

        # Piece Unicode symbols
        self.piece_symbols = {
            'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
            'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔'
        }

        # Load or create font for pieces
        try:
            self.font = ImageFont.truetype("DejaVuSans.ttf", 40)
        except:
            self.font = ImageFont.load_default()

    def generate(self):
        """
        Generate one image with chess board and pieces.

        Returns:
            tuple: (PIL.Image, list of annotations)
            Annotations: [(class_id, x_center, y_center, width, height), ...]
        """
        # Create background
        img = self._create_background()
        draw = ImageDraw.Draw(img)

        # Generate random board position and size
        board_size = random.randint(300, 450)
        board_x = random.randint(30, self.width - board_size - 30)
        board_y = random.randint(30, self.height - board_size - 30)

        # Draw board
        board_style = random.choice(['classic', 'modern', 'wood'])
        self._draw_board(draw, board_x, board_y, board_size, board_style)

        # Generate random position or use common opening
        if random.random() < 0.3:
            # Use starting position
            pieces = self._starting_position()
        else:
            # Random position
            pieces = self._random_position()

        # Draw pieces and collect annotations
        annotations = []

        # Add board annotation (class 0)
        board_annotation = self._create_annotation(
            'BOARD',
            board_x, board_y, board_size, board_size
        )
        annotations.append(board_annotation)

        # Draw and annotate pieces
        square_size = board_size / 8
        for piece_data in pieces:
            rank, file, piece_type = piece_data

            # Calculate piece position on board
            piece_x = board_x + file * square_size
            piece_y = board_y + rank * square_size

            # Draw piece
            self._draw_piece(
                draw, piece_type,
                piece_x + square_size/2, piece_y + square_size/2,
                square_size
            )

            # Create annotation for piece
            piece_annotation = self._create_annotation(
                piece_type,
                piece_x, piece_y, square_size, square_size
            )
            annotations.append(piece_annotation)

        return img, annotations

    def _create_background(self):
        """Create varied background."""
        bg_type = random.choice(['solid', 'gradient', 'texture'])

        if bg_type == 'solid':
            color = (
                random.randint(100, 200),
                random.randint(100, 200),
                random.randint(100, 200)
            )
            img = Image.new('RGB', (self.width, self.height), color)
        elif bg_type == 'gradient':
            img = Image.new('RGB', (self.width, self.height))
            pixels = img.load()
            for y in range(self.height):
                color = (
                    100 + int(y / self.height * 100),
                    100 + int(y / self.height * 100),
                    100 + int(y / self.height * 100)
                )
                for x in range(self.width):
                    pixels[x, y] = color
        else:  # texture
            img = Image.new('RGB', (self.width, self.height))
            pixels = img.load()
            for y in range(self.height):
                for x in range(self.width):
                    noise = random.randint(-30, 30)
                    base = 120
                    pixels[x, y] = (
                        max(0, min(255, base + noise)),
                        max(0, min(255, base + noise)),
                        max(0, min(255, base + noise))
                    )

        return img

    def _draw_board(self, draw, x, y, size, style):
        """Draw chess board."""
        square_size = size / 8

        # Define colors for different styles
        styles = {
            'classic': {'light': (240, 217, 181), 'dark': (181, 136, 99)},
            'modern': {'light': (238, 238, 210), 'dark': (118, 150, 86)},
            'wood': {'light': (222, 184, 135), 'dark': (139, 90, 43)}
        }
        colors = styles[style]

        # Draw squares
        for rank in range(8):
            for file in range(8):
                square_x = x + file * square_size
                square_y = y + rank * square_size

                # Alternate colors
                color = colors['light'] if (rank + file) % 2 == 0 else colors['dark']

                draw.rectangle(
                    [square_x, square_y, square_x + square_size, square_y + square_size],
                    fill=color,
                    outline=None
                )

        # Draw border
        border_color = (50, 50, 50)
        draw.rectangle(
            [x, y, x + size, y + size],
            outline=border_color,
            width=3
        )

    def _draw_piece(self, draw, piece_type, center_x, center_y, square_size):
        """Draw chess piece."""
        symbol = self.piece_symbols[piece_type]

        # Piece color
        if piece_type.isupper():
            piece_color = (255, 255, 255)  # White
            outline_color = (0, 0, 0)
        else:
            piece_color = (0, 0, 0)  # Black
            outline_color = (255, 255, 255)

        # Calculate text size and position
        font_size = int(square_size * 0.7)
        try:
            font = ImageFont.truetype("DejaVuSans.ttf", font_size)
        except:
            font = ImageFont.load_default()

        # Draw piece (simplified as colored circle with symbol)
        piece_radius = square_size * 0.35

        # Draw circle background
        draw.ellipse(
            [center_x - piece_radius, center_y - piece_radius,
             center_x + piece_radius, center_y + piece_radius],
            fill=piece_color,
            outline=outline_color,
            width=2
        )

        # Draw symbol
        bbox = draw.textbbox((0, 0), symbol, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        text_x = center_x - text_width / 2
        text_y = center_y - text_height / 2

        draw.text((text_x, text_y), symbol, font=font, fill=outline_color)

    def _starting_position(self):
        """Return starting chess position."""
        pieces = []

        # Black pieces (rank 0 and 1)
        back_rank_black = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r']
        for file, piece in enumerate(back_rank_black):
            pieces.append((0, file, piece))
        for file in range(8):
            pieces.append((1, file, 'p'))

        # White pieces (rank 6 and 7)
        for file in range(8):
            pieces.append((6, file, 'P'))
        back_rank_white = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
        for file, piece in enumerate(back_rank_white):
            pieces.append((7, file, piece))

        return pieces

    def _random_position(self):
        """Generate random chess position."""
        pieces = []

        # Always add kings (required)
        pieces.append((random.randint(0, 7), random.randint(0, 7), 'k'))
        pieces.append((random.randint(0, 7), random.randint(0, 7), 'K'))

        # Add random pieces (5-25 pieces total)
        num_pieces = random.randint(5, 25)
        piece_types = ['p', 'r', 'n', 'b', 'q', 'P', 'R', 'N', 'B', 'Q']

        occupied = set()
        for piece in pieces:
            occupied.add((piece[0], piece[1]))

        for _ in range(num_pieces):
            rank = random.randint(0, 7)
            file = random.randint(0, 7)

            # Avoid occupied squares
            if (rank, file) not in occupied:
                piece_type = random.choice(piece_types)
                pieces.append((rank, file, piece_type))
                occupied.add((rank, file))

        return pieces

    def _create_annotation(self, class_name, x, y, w, h):
        """Create YOLO format annotation."""
        class_id = self.classes[class_name]

        # Center coordinates
        x_center = (x + w / 2) / self.width
        y_center = (y + h / 2) / self.height

        # Normalized width and height
        norm_width = w / self.width
        norm_height = h / self.height

        return (class_id, x_center, y_center, norm_width, norm_height)


def create_provider(config):
    """Factory function called by DaMa."""
    return ChessBoardProvider(config)
```

---

## Step 3: Configure DaMa

### 3.1 Create `dama.json`

```json
{
  "output_dir": "output/chess_yolo11_dataset",
  "num_images": 10000,
  "image_width": 512,
  "image_height": 512,
  "format": "yolo",
  "train_val_split": 0.85,
  "provider": {
    "module": "providers.chess_yolo11.chess_generator",
    "class": "ChessBoardProvider",
    "config": {
      "image_width": 512,
      "image_height": 512
    }
  },
  "augmentation": {
    "enabled": true,
    "brightness_range": [0.7, 1.3],
    "contrast_range": [0.8, 1.2],
    "blur": true,
    "noise": true,
    "rotation": 5
  },
  "classes": [
    "BOARD",
    "p", "r", "n", "b", "q", "k",
    "P", "R", "N", "B", "Q", "K"
  ]
}
```

### 3.2 Create Provider Init

```bash
mkdir -p providers/chess_yolo11
touch providers/chess_yolo11/__init__.py
```

---

## Step 4: Generate Dataset

### 4.1 Test Generation (10 images)

```bash
# From DaMa root
python3 dama.py --num-images 10 --draw-labels

# Check output
ls output/chess_yolo11_dataset/images/
ls output/chess_yolo11_dataset/labels/

# View images with labels drawn
open output/chess_yolo11_dataset/images/*.jpg
```

**Verify:**
- Board has green bounding box
- Each piece has its own bounding box
- Labels show correct piece types

### 4.2 Full Dataset Generation

```bash
# Generate 10,000 images (takes 20-40 minutes)
python3 dama.py

# Monitor progress
# Generating image 1/10000...
# Generating image 2/10000...
```

### 4.3 Expected Output

```
output/chess_yolo11_dataset/
├── train/
│   ├── images/
│   │   ├── img_0001.jpg (8,500 images)
│   │   └── ...
│   └── labels/
│       ├── img_0001.txt (8,500 labels)
│       └── ...
└── val/
    ├── images/
    │   └── ... (1,500 images)
    └── labels/
        └── ... (1,500 labels)
```

### 4.4 Verify Annotations

Check a label file:

```bash
cat output/chess_yolo11_dataset/train/labels/img_0001.txt
```

Expected format:
```
0 0.500 0.500 0.700 0.700  # BOARD
7 0.156 0.844 0.088 0.088  # P (white pawn)
1 0.156 0.156 0.088 0.088  # p (black pawn)
...
```

Each line: `class_id x_center y_center width height` (normalized 0-1)

---

## Step 5: Dataset Quality Check

### 5.1 Statistics Script

Create `check_dataset.py`:

```python
# check_dataset.py

import os
import glob

def analyze_dataset(dataset_path):
    """Analyze generated chess dataset."""

    label_files = glob.glob(f"{dataset_path}/train/labels/*.txt")

    total_images = len(label_files)
    total_pieces = 0
    total_boards = 0
    piece_counts = {}

    for label_file in label_files:
        with open(label_file, 'r') as f:
            lines = f.readlines()

            for line in lines:
                parts = line.strip().split()
                if len(parts) >= 5:
                    class_id = int(parts[0])

                    if class_id == 0:
                        total_boards += 1
                    else:
                        total_pieces += 1
                        piece_counts[class_id] = piece_counts.get(class_id, 0) + 1

    print(f"="*50)
    print(f"Dataset Statistics")
    print(f"="*50)
    print(f"Total images: {total_images}")
    print(f"Total boards: {total_boards}")
    print(f"Total pieces: {total_pieces}")
    print(f"Average pieces per image: {total_pieces / total_images:.1f}")
    print(f"\nPiece distribution:")

    classes = ["BOARD", "p", "r", "n", "b", "q", "k", "P", "R", "N", "B", "Q", "K"]
    for class_id, count in sorted(piece_counts.items()):
        print(f"  {classes[class_id]}: {count}")

# Run
analyze_dataset("output/chess_yolo11_dataset")
```

Run it:
```bash
python3 check_dataset.py
```

Expected output:
```
==================================================
Dataset Statistics
==================================================
Total images: 8500
Total boards: 8500
Total pieces: 153000
Average pieces per image: 18.0

Piece distribution:
  p: 12750
  r: 6800
  n: 6750
  ...
```

---

## Step 6: Create YOLO11 Dataset Config

Create `chess.yaml`:

```yaml
# output/chess_yolo11_dataset/chess.yaml

path: /home/user/workspace/DaMa/output/chess_yolo11_dataset
train: train/images
val: val/images

# Number of classes
nc: 13

# Class names (must match order from dama.json)
names:
  0: BOARD
  1: p  # black pawn
  2: r  # black rook
  3: n  # black knight
  4: b  # black bishop
  5: q  # black queen
  6: k  # black king
  7: P  # white Pawn
  8: R  # white Rook
  9: N  # white Knight
  10: B  # white Bishop
  11: Q  # white Queen
  12: K  # white King
```

---

## Troubleshooting

### Issue: Pieces overlap or off board

**Solution**: Adjust piece placement logic in `_random_position()`:
```python
# Ensure pieces stay on board
rank = random.randint(0, 7)
file = random.randint(0, 7)

# Check for collisions before placing
if (rank, file) not in occupied:
    ...
```

### Issue: Board too small/large

**Solution**: Adjust board size range:
```python
board_size = random.randint(350, 450)  # Increase minimum
```

### Issue: Pieces hard to see

**Solution**: Increase piece size or contrast:
```python
piece_radius = square_size * 0.40  # Larger pieces
```

### Issue: Annotations incorrect

**Solution**: Verify coordinate calculations:
```python
# Debug print in _create_annotation
print(f"Class: {class_name}, Box: ({x}, {y}, {w}, {h})")
print(f"Normalized: ({x_center}, {y_center}, {norm_width}, {norm_height})")
```

---

## Next Steps

✅ **Dataset generated: 10,000+ chess board images with 13-class annotations**

**Dataset location:** `~/workspace/DaMa/output/chess_yolo11_dataset/`

**Statistics:**
- 8,500 training images
- 1,500 validation images
- ~150,000+ piece annotations
- 1 board annotation per image

**Next:** Proceed to Phase 2 to train YOLO11 on this chess dataset.

---

## Dataset Statistics (Expected)

- **Total images**: 10,000
- **Training**: 8,500 (85%)
- **Validation**: 1,500 (15%)
- **Total annotations**: ~180,000
  - 10,000 boards
  - ~170,000 pieces (avg 17 pieces/image)
- **Disk space**: ~1-2 GB
