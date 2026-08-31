import httpx

from app.config.settings import settings


class TranscriptionClient:
    """
    Wraps Groq's Whisper transcription endpoint. Kept separate from
    WhatsAppClient since transcription is a Groq concern, not a Meta one —
    if you ever swap providers, only this file changes.
    """

    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.base_url = "https://api.groq.com/openai/v1/audio/transcriptions"

    async def transcribe(self, audio_bytes: bytes, filename: str = "voice_note.ogg") -> str:
        headers = {"Authorization": f"Bearer {self.api_key}"}
        files = {"file": (filename, audio_bytes, "audio/ogg")}
        data = {"model": "whisper-large-v3-turbo"}

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(self.base_url, headers=headers, files=files, data=data)
            response.raise_for_status()
            return response.json()["text"]