"""
AI-powered TikTok niche hunter using Claude.
Analyzes trends and finds profitable niches for TikTok content.
"""

import json
import anthropic
import config


class NicheHunter:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)

    def hunt_niches(self, count: int = 5) -> list[dict]:
        """Find trending and profitable TikTok niches using Claude AI."""
        print(f"[NicheHunter] AI se {count} top niches dhundh raha hun...")

        prompt = f"""You are a viral TikTok content strategist with deep knowledge of trending niches.

Analyze current TikTok trends and identify the TOP {count} most profitable and viral niches right now.

For each niche provide:
1. niche_name: Short catchy name
2. category: (e.g., Finance, Fitness, Comedy, Motivation, Tech, Beauty, Food, etc.)
3. target_audience: Who watches this content
4. viral_potential: Score 1-10
5. monetization_potential: Score 1-10
6. content_angle: Unique angle that makes this viral
7. sample_topics: List of 3 specific video topic ideas
8. hashtags: List of 8-10 relevant TikTok hashtags
9. posting_times: Best times to post (e.g., "7PM-9PM EST")
10. trend_reason: Why this niche is trending right now

Focus on niches that:
- Are currently trending (not oversaturated)
- Have high engagement rates
- Can be monetized through TikTok Creator Fund, brand deals, or affiliate marketing
- Can be automated with AI-generated content

Return ONLY a valid JSON array, no other text:
[
  {{
    "niche_name": "...",
    "category": "...",
    "target_audience": "...",
    "viral_potential": 9,
    "monetization_potential": 8,
    "content_angle": "...",
    "sample_topics": ["topic1", "topic2", "topic3"],
    "hashtags": ["#tag1", "#tag2"],
    "posting_times": "...",
    "trend_reason": "..."
  }}
]"""

        message = self.client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )

        raw = message.content[0].text.strip()

        # Extract JSON if wrapped in code block
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        elif "```" in raw:
            raw = raw.split("```")[1].split("```")[0].strip()

        niches = json.loads(raw)
        print(f"[NicheHunter] {len(niches)} niches mil gayi!")
        for i, n in enumerate(niches, 1):
            print(f"  {i}. {n['niche_name']} | Viral: {n['viral_potential']}/10 | Money: {n['monetization_potential']}/10")
        return niches

    def generate_video_script(self, niche: dict, topic: str) -> dict:
        """Generate a complete video script for a given niche and topic."""
        print(f"[NicheHunter] '{topic}' ke liye script likh raha hun...")

        prompt = f"""You are a viral TikTok scriptwriter. Write a punchy, engaging script for a TikTok video.

NICHE: {niche['niche_name']}
CATEGORY: {niche['category']}
TARGET AUDIENCE: {niche['target_audience']}
CONTENT ANGLE: {niche['content_angle']}
TOPIC: {topic}

Requirements:
- Hook in first 3 seconds (must stop the scroll)
- Total duration: 25-35 seconds when spoken
- Use simple, conversational language
- Include a strong call-to-action at the end
- No complex words — speak like a friend
- High energy, fast-paced

Return ONLY valid JSON:
{{
  "title": "Video title for TikTok caption",
  "hook": "First 3-second hook line (must be shocking/curiosity-inducing)",
  "script_lines": [
    "Line 1...",
    "Line 2...",
    "Line 3..."
  ],
  "caption": "Full TikTok caption with emojis and hashtags (max 300 chars)",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "background_search_query": "search term for background video (e.g. 'money falling', 'city timelapse')",
  "text_overlay_style": "bold/minimal/colorful",
  "estimated_duration_seconds": 30
}}"""

        message = self.client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        )

        raw = message.content[0].text.strip()
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        elif "```" in raw:
            raw = raw.split("```")[1].split("```")[0].strip()

        script = json.loads(raw)
        print(f"[NicheHunter] Script ready: '{script['title']}'")
        return script
