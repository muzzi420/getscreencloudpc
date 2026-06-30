import os
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY", "")
TIKTOK_EMAIL = os.getenv("TIKTOK_EMAIL", "")
TIKTOK_PASSWORD = os.getenv("TIKTOK_PASSWORD", "")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")

NICHES_PER_RUN = int(os.getenv("NICHES_PER_RUN", "5"))
VIDEOS_PER_NICHE = int(os.getenv("VIDEOS_PER_NICHE", "1"))
RUN_EVERY_HOURS = int(os.getenv("RUN_EVERY_HOURS", "6"))

VIDEO_WIDTH = 1080
VIDEO_HEIGHT = 1920
VIDEO_FPS = 30
VIDEO_DURATION = 30  # seconds

OUTPUT_DIR = "output"
TEMP_DIR = "temp"
