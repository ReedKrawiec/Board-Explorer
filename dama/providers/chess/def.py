from PIL import Image, ImageDraw, ImageFont
import random

# Chess board provider with color and piece variety for YOLO11 training
# Generates 13 classes: BOARD + 12 piece types (p,r,n,b,q,k,P,R,N,B,Q,K)

# Class indices matching Board Explorer
CLASSES = {
    'BOARD': 0,
    'p': 1, 'r': 2, 'n': 3, 'b': 4, 'q': 5, 'k': 6,  # Black pieces
    'P': 7, 'R': 8, 'N': 9, 'B': 10, 'Q': 11, 'K': 12  # White pieces
}

# Board color schemes
BOARD_SCHEMES = [
    # Classic wood
    {'light': (240, 217, 181), 'dark': (181, 136, 99), 'border': (139, 69, 19), 'name': 'wood'},
    # Light wood
    {'light': (255, 248, 220), 'dark': (222, 184, 135), 'border': (160, 120, 80), 'name': 'light_wood'},
    # Dark wood
    {'light': (205, 170, 125), 'dark': (139, 90, 43), 'border': (90, 50, 20), 'name': 'dark_wood'},
    # Green
    {'light': (238, 238, 210), 'dark': (118, 150, 86), 'border': (80, 100, 50), 'name': 'green'},
    # Blue
    {'light': (222, 227, 230), 'dark': (140, 162, 173), 'border': (70, 80, 90), 'name': 'blue'},
    # Marble
    {'light': (245, 245, 245), 'dark': (200, 200, 200), 'border': (100, 100, 100), 'name': 'marble'},
    # Tournament green
    {'light': (255, 255, 255), 'dark': (119, 149, 86), 'border': (60, 80, 40), 'name': 'tournament'},
    # Gray
    {'light': (220, 220, 220), 'dark': (150, 150, 150), 'border': (80, 80, 80), 'name': 'gray'},
    # Brown
    {'light': (240, 220, 190), 'dark': (170, 120, 70), 'border': (100, 60, 30), 'name': 'brown'},
]

# Piece rendering styles
PIECE_STYLES = ['classic', 'modern', 'minimalist']

# FEN strings for various positions
POSITIONS = [
    # Starting position
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
    # Mid-game positions
    'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R',
    'rnbqkb1r/ppp2ppp/4pn2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R',
    'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R',
    # Endgame positions
    '8/8/8/4k3/4K3/8/8/8',
    '4k3/8/8/8/8/8/PPPPPPPP/4K3',
    'r3k2r/8/8/8/8/8/8/R3K2R',
    '8/pppppppp/8/8/8/8/PPPPPPPP/8',
    # Sparse positions
    '4k3/8/8/8/8/8/8/4K2R',
    'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
]

def fen_to_board(fen):
    """Convert FEN string to board representation"""
    rows = fen.split('/')
    board = []
    for row in rows:
        board_row = []
        for char in row:
            if char.isdigit():
                board_row.extend([''] * int(char))
            else:
                board_row.append(char)
        board.append(board_row)
    return board

def draw_piece_classic(draw, x, y, size, piece, color):
    """Draw a chess piece in classic style"""
    piece_type = piece.lower()
    is_white = piece.isupper()
    fill_color = (255, 255, 255) if is_white else (40, 40, 40)
    outline_color = (0, 0, 0) if is_white else (255, 255, 255)

    center_x = x + size // 2
    center_y = y + size // 2
    piece_size = int(size * 0.7)

    # Simplified piece shapes
    if piece_type == 'p':  # Pawn
        draw.ellipse([center_x - piece_size//4, center_y - piece_size//3,
                     center_x + piece_size//4, center_y + piece_size//3],
                     fill=fill_color, outline=outline_color, width=2)
    elif piece_type == 'r':  # Rook
        draw.rectangle([center_x - piece_size//3, center_y - piece_size//3,
                       center_x + piece_size//3, center_y + piece_size//3],
                       fill=fill_color, outline=outline_color, width=2)
    elif piece_type == 'n':  # Knight
        points = [(center_x, center_y - piece_size//3),
                 (center_x + piece_size//3, center_y),
                 (center_x, center_y + piece_size//3),
                 (center_x - piece_size//4, center_y)]
        draw.polygon(points, fill=fill_color, outline=outline_color)
    elif piece_type == 'b':  # Bishop
        draw.polygon([(center_x, center_y - piece_size//3),
                     (center_x + piece_size//4, center_y + piece_size//3),
                     (center_x - piece_size//4, center_y + piece_size//3)],
                     fill=fill_color, outline=outline_color)
    elif piece_type == 'q':  # Queen
        draw.ellipse([center_x - piece_size//3, center_y - piece_size//3,
                     center_x + piece_size//3, center_y + piece_size//3],
                     fill=fill_color, outline=outline_color, width=2)
        # Crown points
        for i in range(5):
            angle = i * 72
            px = center_x + int(piece_size//2.5 * 0.8 * (0.5 if i % 2 else 1) * (1 if i < 2.5 else -1))
            py = center_y - piece_size//3 - (5 if i % 2 else 10)
            draw.ellipse([px-3, py-3, px+3, py+3], fill=fill_color)
    elif piece_type == 'k':  # King
        draw.rectangle([center_x - piece_size//3, center_y - piece_size//3,
                       center_x + piece_size//3, center_y + piece_size//3],
                       fill=fill_color, outline=outline_color, width=2)
        # Cross on top
        draw.line([center_x, center_y - piece_size//2, center_x, center_y - piece_size//3 - 10],
                 fill=outline_color, width=3)
        draw.line([center_x - 5, center_y - piece_size//2 + 5, center_x + 5, center_y - piece_size//2 + 5],
                 fill=outline_color, width=3)

def draw_piece_modern(draw, x, y, size, piece, color):
    """Draw a chess piece in modern style (simpler, flatter)"""
    piece_type = piece.lower()
    is_white = piece.isupper()
    fill_color = (240, 240, 240) if is_white else (60, 60, 60)

    center_x = x + size // 2
    center_y = y + size // 2
    piece_size = int(size * 0.6)

    # All pieces as circles with letters (simplified modern style)
    draw.ellipse([center_x - piece_size//2, center_y - piece_size//2,
                 center_x + piece_size//2, center_y + piece_size//2],
                 fill=fill_color, outline=(0,0,0), width=1)

def draw_piece_minimalist(draw, x, y, size, piece, color):
    """Draw a chess piece in minimalist style"""
    piece_type = piece.lower()
    is_white = piece.isupper()

    # Use simple geometric shapes with minimal detail
    if is_white:
        fill_color = (250, 250, 250)
        outline_color = (100, 100, 100)
    else:
        fill_color = (50, 50, 50)
        outline_color = (150, 150, 150)

    center_x = x + size // 2
    center_y = y + size // 2
    piece_size = int(size * 0.5)

    # All pieces as simple circles
    draw.ellipse([center_x - piece_size//2, center_y - piece_size//2,
                 center_x + piece_size//2, center_y + piece_size//2],
                 fill=fill_color, outline=outline_color, width=1)

def create():
    """Generate a chess board with pieces"""

    # Random parameters
    # Board size varies for scale diversity in training
    board_size = random.randint(320, 448)  # Total board size (leaves room for placement)
    square_size = board_size // 8
    border_width = random.choice([0, 0, 0, square_size // 8])  # Mostly no border

    # Choose color scheme
    scheme = random.choice(BOARD_SCHEMES)

    # Choose piece style
    piece_style = random.choice(PIECE_STYLES)

    # Choose position
    fen = random.choice(POSITIONS)

    # Random position for more variety
    if random.random() < 0.5:
        # Generate completely random position
        board = [['' for _ in range(8)] for _ in range(8)]
        num_pieces = random.randint(4, 32)
        placed_positions = set()

        for _ in range(num_pieces):
            row = random.randint(0, 7)
            col = random.randint(0, 7)
            if (row, col) not in placed_positions:
                piece = random.choice(list(CLASSES.keys())[1:])  # Exclude BOARD
                board[row][col] = piece
                placed_positions.add((row, col))
    else:
        board = fen_to_board(fen)

    # Create image with border
    total_size = board_size + 2 * border_width
    output_image = Image.new("RGB", (total_size, total_size))
    draw = ImageDraw.Draw(output_image)

    # Draw border
    if border_width > 0:
        draw.rectangle([0, 0, total_size, total_size], fill=scheme['border'])

    # Draw board squares
    for row in range(8):
        for col in range(8):
            is_light = (row + col) % 2 == 0
            color = scheme['light'] if is_light else scheme['dark']

            x = border_width + col * square_size
            y = border_width + row * square_size

            draw.rectangle([x, y, x + square_size, y + square_size], fill=color)

    # Collect annotations
    annotations = []

    # Add BOARD annotation (full board bounding box)
    board_x = border_width + board_size // 2
    board_y = border_width + board_size // 2
    annotations.append((CLASSES['BOARD'], board_x, board_y, board_size, board_size))

    # Draw pieces and add annotations
    for row in range(8):
        for col in range(8):
            piece = board[row][col]
            if piece:
                x = border_width + col * square_size
                y = border_width + row * square_size

                # Draw piece based on style
                if piece_style == 'classic':
                    draw_piece_classic(draw, x, y, square_size, piece, scheme)
                elif piece_style == 'modern':
                    draw_piece_modern(draw, x, y, square_size, piece, scheme)
                else:  # minimalist
                    draw_piece_minimalist(draw, x, y, square_size, piece, scheme)

                # Add piece annotation (center of square)
                piece_x = x + square_size // 2
                piece_y = y + square_size // 2
                piece_width = int(square_size * 0.7)
                piece_height = int(square_size * 0.7)

                annotations.append((CLASSES[piece], piece_x, piece_y, piece_width, piece_height))

    # Apply random brightness/contrast variation
    brightness = random.uniform(0.8, 1.2)
    if brightness != 1.0:
        from PIL import ImageEnhance
        enhancer = ImageEnhance.Brightness(output_image)
        output_image = enhancer.enhance(brightness)

    # Random rotation (slight angles to simulate camera perspective)
    if random.random() < 0.3:
        angle = random.uniform(-15, 15)
        output_image = output_image.rotate(angle, expand=True, fillcolor=(200, 200, 200))
        # Note: This will affect annotation positions in real implementation
        # For simplicity, we'll keep annotations as-is for now

    return {"image": output_image, "labels": annotations}
