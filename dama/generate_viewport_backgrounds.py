#!/usr/bin/env python3
"""
Generate realistic computer viewport backgrounds for chess board detection.
Simulates actual environments where chess boards are viewed:
- YouTube video players
- Chess websites (Chess.com, Lichess)
- Twitch streams
- Desktop windows
- Browser interfaces
"""

from PIL import Image, ImageDraw, ImageFont
import random
import os

OUTPUT_DIR = "chess_input"
NUM_BACKGROUNDS = 200  # Increased for more variety

# Realistic viewport scenarios
def create_youtube_background(width, height):
    """Simulate YouTube video player"""
    img = Image.new('RGB', (width, height), (15, 15, 15))  # Dark YouTube background
    draw = ImageDraw.Draw(img)

    # Video player area (center, 16:9 aspect ratio)
    video_width = width - 400  # Leave space for sidebar
    video_height = int(video_width * 9 / 16)
    video_x = 20
    video_y = 80

    # Video player background (where chess board will be placed)
    player_colors = [(20, 20, 25), (25, 25, 30), (18, 18, 22)]
    draw.rectangle([video_x, video_y, video_x + video_width, video_y + video_height],
                   fill=random.choice(player_colors))

    # Top bar (YouTube header)
    draw.rectangle([0, 0, width, 60], fill=(33, 33, 33))

    # Search bar
    draw.rectangle([width//2 - 250, 15, width//2 + 250, 45], fill=(18, 18, 18), outline=(48, 48, 48))

    # Video controls bar at bottom of player
    controls_y = video_y + video_height - 40
    draw.rectangle([video_x, controls_y, video_x + video_width, video_y + video_height],
                   fill=(28, 28, 28), outline=(60, 60, 60))

    # Progress bar
    progress = random.randint(20, 80)
    progress_width = int(video_width * progress / 100)
    draw.rectangle([video_x + 10, controls_y + 10, video_x + 10 + progress_width, controls_y + 15],
                   fill=(255, 0, 0))

    # Sidebar (suggested videos)
    sidebar_x = video_x + video_width + 20
    draw.rectangle([sidebar_x, video_y, width - 20, height - 20], fill=(33, 33, 33))

    # Suggested video thumbnails
    for i in range(5):
        thumb_y = video_y + 20 + i * 120
        draw.rectangle([sidebar_x + 10, thumb_y, sidebar_x + 160, thumb_y + 90],
                      fill=(50, 50, 55))

    # Below video area (description, comments)
    below_y = video_y + video_height + 20
    if below_y < height - 40:  # Only draw if there's space
        draw.rectangle([video_x, below_y, video_x + video_width, height - 20],
                       fill=(24, 24, 24))

    return img

def create_chesscom_background(width, height):
    """Simulate Chess.com website layout"""
    img = Image.new('RGB', (width, height), (48, 46, 44))  # Chess.com dark background
    draw = ImageDraw.Draw(img)

    # Top navigation bar
    draw.rectangle([0, 0, width, 60], fill=(41, 39, 37))

    # Chess.com logo area
    draw.rectangle([20, 10, 120, 50], fill=(119, 153, 84))  # Green accent

    # Navigation items
    nav_colors = [(60, 58, 56), (70, 68, 66)]
    for i in range(5):
        nav_x = 150 + i * 100
        draw.rectangle([nav_x, 15, nav_x + 80, 45], fill=random.choice(nav_colors))

    # Main board area (center)
    board_area_width = min(800, width - 400)
    board_area_x = (width - board_area_width) // 2
    board_area_y = 100

    draw.rectangle([board_area_x, board_area_y,
                   board_area_x + board_area_width, board_area_y + board_area_width],
                   fill=(60, 58, 56))

    # Side panel (moves, chat)
    side_panel_x = board_area_x + board_area_width + 20
    if side_panel_x + 300 < width:
        draw.rectangle([side_panel_x, board_area_y, width - 20, height - 20],
                      fill=(41, 39, 37))

        # Chat messages
        for i in range(8):
            msg_y = board_area_y + 50 + i * 45
            draw.rectangle([side_panel_x + 10, msg_y, side_panel_x + 280, msg_y + 35],
                          fill=(48, 46, 44))

    # Bottom panel (evaluation, analysis)
    bottom_y = board_area_y + board_area_width + 20
    if bottom_y < height - 40:  # Only draw if there's space
        draw.rectangle([board_area_x, bottom_y, board_area_x + board_area_width, height - 20],
                       fill=(41, 39, 37))

    return img

def create_lichess_background(width, height):
    """Simulate Lichess website layout"""
    img = Image.new('RGB', (width, height), (34, 35, 38))  # Lichess dark theme
    draw = ImageDraw.Draw(img)

    # Top bar
    draw.rectangle([0, 0, width, 50], fill=(23, 24, 26))

    # Lichess logo area
    draw.rectangle([20, 10, 100, 40], fill=(188, 140, 76))  # Lichess gold

    # Board area (slightly off-center for realism)
    board_size = min(700, width - 500)
    board_x = 100 + random.randint(0, 100)
    board_y = 80

    draw.rectangle([board_x, board_y, board_x + board_size, board_y + board_size],
                   fill=(44, 45, 48))

    # Right sidebar (moves, clock)
    sidebar_x = board_x + board_size + 30
    if sidebar_x + 250 < width:
        draw.rectangle([sidebar_x, board_y, sidebar_x + 250, board_y + 400],
                      fill=(44, 45, 48))

        # Clock displays
        draw.rectangle([sidebar_x + 10, board_y + 10, sidebar_x + 240, board_y + 60],
                      fill=(60, 61, 64))
        draw.rectangle([sidebar_x + 10, board_y + 340, sidebar_x + 240, board_y + 390],
                      fill=(60, 61, 64))

    return img

def create_twitch_background(width, height):
    """Simulate Twitch stream layout"""
    img = Image.new('RGB', (width, height), (24, 24, 27))  # Twitch dark background
    draw = ImageDraw.Draw(img)

    # Top bar
    draw.rectangle([0, 0, width, 50], fill=(31, 31, 35))

    # Twitch logo area
    draw.rectangle([20, 10, 100, 40], fill=(145, 70, 255))  # Twitch purple

    # Video player area (larger, takes most of screen)
    video_width = width - 380
    video_height = int(video_width * 9 / 16)
    video_x = 20
    video_y = 70

    draw.rectangle([video_x, video_y, video_x + video_width, video_y + video_height],
                   fill=(18, 18, 20))

    # Stream overlay elements (viewer count, etc.)
    draw.rectangle([video_x + 20, video_y + 20, video_x + 150, video_y + 50],
                   fill=(0, 0, 0, 180))

    # Chat panel (right side)
    chat_x = video_x + video_width + 20
    draw.rectangle([chat_x, video_y, width - 20, height - 20], fill=(31, 31, 35))

    # Chat messages
    message_colors = [(38, 38, 42), (42, 42, 46)]
    for i in range(20):
        msg_y = video_y + 60 + i * 40
        if msg_y < height - 80:
            draw.rectangle([chat_x + 10, msg_y, width - 30, msg_y + 35],
                          fill=random.choice(message_colors))

    # Below video (stream info)
    below_y = video_y + video_height + 20
    if below_y + 100 < height:  # Only draw if there's space
        draw.rectangle([video_x, below_y, video_x + video_width, below_y + 100],
                       fill=(31, 31, 35))

    return img

def create_desktop_window_background(width, height):
    """Simulate desktop application window"""
    # Desktop background colors
    bg_colors = [
        (45, 45, 48),   # Dark gray
        (30, 30, 35),   # Darker blue-gray
        (40, 35, 40),   # Purple-gray
        (35, 40, 45),   # Blue-gray
    ]

    img = Image.new('RGB', (width, height), random.choice(bg_colors))
    draw = ImageDraw.Draw(img)

    # Window frame
    window_x = random.randint(50, 150)
    window_y = random.randint(30, 80)
    window_width = width - window_x - random.randint(50, 150)
    window_height = height - window_y - random.randint(30, 80)

    # Title bar
    title_bar_colors = [(50, 50, 54), (45, 45, 50), (55, 55, 60)]
    draw.rectangle([window_x, window_y, window_x + window_width, window_y + 35],
                   fill=random.choice(title_bar_colors))

    # Window buttons (close, minimize, maximize)
    for i in range(3):
        btn_x = window_x + window_width - 120 + i * 40
        draw.rectangle([btn_x, window_y + 8, btn_x + 30, window_y + 27],
                      fill=(70, 70, 75))

    # Window content area
    content_colors = [(60, 60, 65), (55, 55, 60), (65, 65, 70)]
    draw.rectangle([window_x, window_y + 35,
                   window_x + window_width, window_y + window_height],
                   fill=random.choice(content_colors))

    return img

def create_browser_tab_background(width, height):
    """Simulate browser with multiple tabs"""
    img = Image.new('RGB', (width, height), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Browser chrome (top bar)
    draw.rectangle([0, 0, width, 80], fill=(232, 232, 235))

    # Tabs
    tab_colors = [(255, 255, 255), (240, 240, 243), (250, 250, 252)]
    active_tab = random.randint(0, 4)
    for i in range(5):
        tab_x = 10 + i * 200
        tab_color = (255, 255, 255) if i == active_tab else (220, 220, 223)
        draw.rectangle([tab_x, 40, tab_x + 190, 80], fill=tab_color, outline=(200, 200, 203))

    # Address bar
    draw.rectangle([20, 10, width - 120, 35], fill=(255, 255, 255), outline=(200, 200, 203))

    # Browser buttons
    for i in range(3):
        draw.ellipse([width - 110 + i * 35, 12, width - 85 + i * 35, 32],
                    fill=(220, 220, 223))

    # Content area (where chess board will be)
    content_colors = [(250, 250, 252), (245, 245, 248), (255, 255, 255)]
    draw.rectangle([0, 80, width, height], fill=random.choice(content_colors))

    # Simulate some page content (sidebars, headers)
    if random.random() < 0.5:
        # Left sidebar
        draw.rectangle([0, 80, 200, height], fill=(240, 240, 243))

    if random.random() < 0.5:
        # Right sidebar
        draw.rectangle([width - 250, 80, width, height], fill=(240, 240, 243))

    return img

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Distribution of background types
    backgrounds = [
        ('youtube', create_youtube_background, 40),      # 40 YouTube backgrounds
        ('chesscom', create_chesscom_background, 40),    # 40 Chess.com
        ('lichess', create_lichess_background, 40),      # 40 Lichess
        ('twitch', create_twitch_background, 30),        # 30 Twitch
        ('desktop', create_desktop_window_background, 30), # 30 Desktop windows
        ('browser', create_browser_tab_background, 20),  # 20 Browser tabs
    ]

    counter = 0
    for bg_type, bg_func, count in backgrounds:
        for i in range(count):
            # Vary resolution slightly for realism
            width = random.choice([1920, 1920, 1920, 2560, 1680])
            height = random.choice([1080, 1080, 1080, 1440, 1050])

            img = bg_func(width, height)

            # Add slight noise for realism
            if random.random() < 0.3:
                from PIL import ImageFilter
                img = img.filter(ImageFilter.GaussianBlur(radius=0.5))

            filename = f"{OUTPUT_DIR}/viewport_{bg_type}_{counter:04d}.png"
            img.save(filename)
            counter += 1
            print(f"Generated {bg_type} background {i+1}/{count}")

    print(f"\n✓ Generated {counter} realistic viewport backgrounds in {OUTPUT_DIR}/")
    print(f"  - {backgrounds[0][2]} YouTube video players")
    print(f"  - {backgrounds[1][2]} Chess.com layouts")
    print(f"  - {backgrounds[2][2]} Lichess layouts")
    print(f"  - {backgrounds[3][2]} Twitch streams")
    print(f"  - {backgrounds[4][2]} Desktop windows")
    print(f"  - {backgrounds[5][2]} Browser tabs")
    print(f"\nReady to run: python3 dama.py --config chess-config.json")

if __name__ == "__main__":
    main()
