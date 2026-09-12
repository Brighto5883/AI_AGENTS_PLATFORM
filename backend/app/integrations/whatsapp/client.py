import logging

import httpx

from app.config.settings import settings

logger = logging.getLogger(__name__)

GRAPH_API_VERSION = "v21.0"


class WhatsAppClient:
    """
    Thin wrapper around Meta's Cloud API. Owns nothing but the HTTP call —
    no business logic, no persistence. Anything that decides *what* to send
    lives in WhatsAppService; this just sends it.
    """

    def __init__(self):
        self.phone_number_id = settings.WHATSAPP_PHONE_NUMBER_ID
        self.access_token = settings.WHATSAPP_ACCESS_TOKEN
        self.base_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{self.phone_number_id}/messages"
        self._client: httpx.AsyncClient | None = None

    async def initialize(self):
        self._client = httpx.AsyncClient(
            timeout=10.0,
            follow_redirects=True,
            headers={
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json",
                "User-Agent": "AI-Agents-Platform/1.0",
            },
        )


    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            raise RuntimeError(
                "WhatsAppClient has not been initialized. "
                "Call initialize() before making requests."
            )

        return self._client

    async def get_media_url(self, media_id: str) -> str:
        """Step 1 of Meta's two-step media fetch: media ID -> temporary download URL."""
        client = self._get_client()
        
        response = await client.get(
            f"https://graph.facebook.com/{GRAPH_API_VERSION}/{media_id}"
        )
        response.raise_for_status()
        return response.json()["url"]


    async def download_media(self, media_url: str) -> bytes:
        """Step 2: the URL from get_media_url is itself auth-gated, needs the same bearer token."""
        client = self._get_client()
        
        response = await client.get(media_url)
        response.raise_for_status()

        logger.debug(
            "WhatsApp media downloaded",
            extra={
                "status_code": response.status_code,
                "byte_count": len(response.content),
                "content_type": response.headers.get("content-type"),
            },
        )

        return response.content


    async def send_text_message(self, to_phone: str, body: str) -> dict:
        payload = {
            "messaging_product": "whatsapp",
            "to": to_phone,
            "type": "text",
            "text": {"body": body},
        }

        client = self._get_client()

        response = await client.post(self.base_url, json=payload)
        response.raise_for_status()
        return response.json()


    async def close(self):
        if self._client is not None:
            await self._client.aclose()
            self._client = None