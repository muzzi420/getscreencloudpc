"""
AI Video Creator — assembles TikTok-ready vertical videos.
Pipeline: voiceover -> background video -> text overlays -> final render
"""

import os
import re
import time
import uuid
import requests
import textwrap
from pathlib import Path

from gtts import gTTS
from PIL import Image, ImageDraw, ImageFont
from moviepy.editor import (
    VideoFileClip,
    AudioFileClip,
    ImageClip,
    CompositeVideoClip,
    concatenate_videoclips,
    ColorClip,
)

import config


class VideoCreator:
    def __init__(self):
        Path(config.OUTPUT_DIR).mkdir(exist_ok=True)
        Path(config.TEMP_DIR).mkdir(exist_ok=True)

    # ------------------------------------------------------------------
    # Voiceover
    # ------------------------------------------------------------------

    def create_voiceover(self, script_lines: list[str], output_path: str) -> float:
        """Convert script lines to voiceover MP3, return audio duration."""
        full_text = " ".join(script_lines)
        print(f"[VideoCreator] Voiceover bana raha hun ({len(full_text)} chars)...")

        if config.ELEVENLABS_API_KEY:
            return self._elevenlabs_voiceover(full_text, output_path)
        return self._gtts_voiceover(full_text, output_path)

    def _gtts_voiceover(self, text: str, output_path: str) -> float:
        tts = gTTS(text=text, lang="en", slow=False)
        tts.save(output_path)
        clip = AudioFileClip(output_path)
        duration = clip.duration
        clip.close()
        print(f"[VideoCreator] Voiceover ready: {duration:.1f}s")
        return duration

    def _elevenlabs_voiceover(self, text: str, output_path: str) -> float:
        url = "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": config.ELEVENLABS_API_KEY,
        }
        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
        }
        r = requests.post(url, json=data, headers=headers)
        r.raise_for_status()
        with open(output_path, "wb") as f:
            f.write(r.content)
        clip = AudioFileClip(output_path)
        duration = clip.duration
        clip.close()
        print(f"[VideoCreator] ElevenLabs voiceover ready: {duration:.1f}s")
        return duration

    # ------------------------------------------------------------------
    # Background video from Pexels
    # ------------------------------------------------------------------

    def fetch_background_video(self, query: str, duration_needed: float) -> str | None:
        """Download a relevant stock video from Pexels."""
        if not config.PEXELS_API_KEY:
            print("[VideoCreator] Pexels key nahi — solid color background use karunga")
            return None

        print(f"[VideoCreator] Pexels se background dhundh raha hun: '{query}'")
        headers = {"Authorization": config.PEXELS_API_KEY}
        params = {"query": query, "orientation": "portrait", "per_page": 10, "size": "medium"}

        r = requests.get("https://api.pexels.com/videos/search", headers=headers, params=params)
        if r.status_code != 200:
            print(f"[VideoCreator] Pexels error {r.status_code}")
            return None

        videos = r.json().get("videos", [])
        if not videos:
            print("[VideoCreator] Pexels par koi video nahi mila")
            return None

        # Pick a video long enough or loop
        for vid in videos:
            for file in vid.get("video_files", []):
                if file.get("quality") in ("hd", "sd") and file.get("width", 0) <= 1080:
                    url = file["link"]
                    path = os.path.join(config.TEMP_DIR, f"bg_{uuid.uuid4().hex[:8]}.mp4")
                    print(f"[VideoCreator] Downloading background video...")
                    with requests.get(url, stream=True) as resp:
                        with open(path, "wb") as f:
                            for chunk in resp.iter_content(chunk_size=8192):
                                f.write(chunk)
                    print(f"[VideoCreator] Background video downloaded: {path}")
                    return path

        return None

    # ------------------------------------------------------------------
    # Text overlay frames
    # ------------------------------------------------------------------

    def _make_text_image(self, text: str, width: int, height: int, style: str = "bold") -> str:
        """Create a transparent PNG with text overlay."""
        img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Try to load a bold font, fall back to default
        font_size = 72
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except Exception:
            font = ImageFont.load_default()

        # Text colors based on style
        if style == "bold":
            fill = (255, 255, 255, 255)
            stroke = (0, 0, 0, 255)
            stroke_width = 3
        elif style == "colorful":
            fill = (255, 220, 0, 255)
            stroke = (200, 0, 0, 255)
            stroke_width = 3
        else:  # minimal
            fill = (255, 255, 255, 200)
            stroke = (50, 50, 50, 180)
            stroke_width = 2

        # Wrap text
        wrapper = textwrap.TextWrapper(width=22)
        lines = wrapper.wrap(text)
        wrapped = "\n".join(lines)

        bbox = draw.textbbox((0, 0), wrapped, font=font, stroke_width=stroke_width)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
        x = (width - text_w) // 2
        y = height - text_h - 180  # bottom area

        draw.text((x, y), wrapped, font=font, fill=fill, stroke_width=stroke_width, stroke_fill=stroke)

        path = os.path.join(config.TEMP_DIR, f"text_{uuid.uuid4().hex[:8]}.png")
        img.save(path, "PNG")
        return path

    def _make_hook_image(self, hook_text: str, width: int, height: int) -> str:
        """Big centered hook text for first 3 seconds."""
        img = Image.new("RGBA", (width, height), (0, 0, 0, 180))
        draw = ImageDraw.Draw(img)

        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 90)
        except Exception:
            font = ImageFont.load_default()

        wrapper = textwrap.TextWrapper(width=18)
        lines = wrapper.wrap(hook_text)
        wrapped = "\n".join(lines)

        bbox = draw.textbbox((0, 0), wrapped, font=font, stroke_width=4)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
        x = (width - text_w) // 2
        y = (height - text_h) // 2

        draw.text((x, y), wrapped, font=font, fill=(255, 220, 0, 255), stroke_width=4, stroke_fill=(0, 0, 0, 255))

        path = os.path.join(config.TEMP_DIR, f"hook_{uuid.uuid4().hex[:8]}.png")
        img.save(path, "PNG")
        return path

    # ------------------------------------------------------------------
    # Main video assembly
    # ------------------------------------------------------------------

    def create_video(self, script: dict, niche: dict) -> str:
        """
        Full pipeline: voiceover + background + overlays = final TikTok video.
        Returns path to the finished .mp4 file.
        """
        job_id = uuid.uuid4().hex[:8]
        print(f"\n[VideoCreator] Video assembly shuru: job={job_id}")

        lines = script.get("script_lines", [])
        hook = script.get("hook", "")
        title = script.get("title", "video")
        style = script.get("text_overlay_style", "bold")
        bg_query = script.get("background_search_query", niche.get("category", "nature"))

        W, H = config.VIDEO_WIDTH, config.VIDEO_HEIGHT

        # 1. Voiceover
        audio_path = os.path.join(config.TEMP_DIR, f"audio_{job_id}.mp3")
        duration = self.create_voiceover([hook] + lines, audio_path)
        duration = max(duration, 15.0)  # minimum 15s

        # 2. Background
        bg_video_path = self.fetch_background_video(bg_query, duration)

        if bg_video_path:
            bg_clip = VideoFileClip(bg_video_path).resize((W, H))
            if bg_clip.duration < duration:
                loops = int(duration / bg_clip.duration) + 1
                bg_clip = concatenate_videoclips([bg_clip] * loops)
            bg_clip = bg_clip.subclip(0, duration)
        else:
            # Gradient-like dark background
            bg_clip = ColorClip(size=(W, H), color=(15, 15, 30), duration=duration)

        # 3. Text overlays
        clips = [bg_clip]

        # Hook overlay: first 3 seconds
        hook_img_path = self._make_hook_image(hook, W, H)
        hook_clip = (
            ImageClip(hook_img_path)
            .set_duration(min(3.5, duration))
            .set_start(0)
            .set_opacity(0.95)
        )
        clips.append(hook_clip)

        # Script lines: show each line timed evenly after hook
        time_per_line = (duration - 3.5) / max(len(lines), 1)
        for i, line in enumerate(lines):
            if not line.strip():
                continue
            start = 3.5 + i * time_per_line
            end = min(start + time_per_line + 0.5, duration)
            text_img_path = self._make_text_image(line, W, H, style)
            line_clip = (
                ImageClip(text_img_path)
                .set_duration(end - start)
                .set_start(start)
                .set_opacity(0.9)
            )
            clips.append(line_clip)

        # 4. Composite + audio
        final = CompositeVideoClip(clips, size=(W, H))
        audio = AudioFileClip(audio_path)
        final = final.set_audio(audio)

        safe_title = re.sub(r"[^a-zA-Z0-9_-]", "_", title)[:40]
        output_path = os.path.join(config.OUTPUT_DIR, f"{safe_title}_{job_id}.mp4")

        print(f"[VideoCreator] Render kar raha hun → {output_path}")
        final.write_videofile(
            output_path,
            fps=config.VIDEO_FPS,
            codec="libx264",
            audio_codec="aac",
            temp_audiofile=os.path.join(config.TEMP_DIR, f"tmp_audio_{job_id}.m4a"),
            remove_temp=True,
            verbose=False,
            logger=None,
        )

        # Cleanup temp files
        for p in [audio_path, hook_img_path]:
            try:
                os.remove(p)
            except Exception:
                pass

        print(f"[VideoCreator] Video ready: {output_path}")
        return output_path
