import httpx

from app.config.settings import settings

YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"


class YouTubeClient:
    """
    Thin wrapper around YouTube Data API v3. Read-only for now (API key
    auth) — posting replies or reading live chat needs OAuth, added when
    Phase B/C actually require it. Owns nothing but the HTTP calls; any
    reasoning about what to do with this data lives in the agent/service.
    """

    def __init__(self):
        self.api_key = settings.YOUTUBE_API_KEY
        self._client: httpx.AsyncClient | None = None

    async def initialize(self):
        self._client = httpx.AsyncClient(
            timeout=15.0, 
            follow_redirects=True
        )

    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            raise RuntimeError(
                "YouTubeClient has not been initialized. "
                "Call initialize() before making requests."
            )

        return self._client

    async def get_video_details(self, video_id: str) -> dict:
        """Title, description, published date, view/like/comment counts."""
        client = self._get_client()

        response = await client.get(
            f"{YOUTUBE_API_BASE}/videos",
            params={
                "part": "snippet,statistics",
                "id": video_id,
                "key": self.api_key,
            },
        )
        response.raise_for_status()
        items = response.json().get("items", [])
        return items[0] if items else {}

    async def get_comments(self, video_id: str, max_results: int = 100) -> list[dict]:
        """
        Fetches top-level comments (not reply threads) for a video.
        Paginates until max_results is reached or comments run out.
        """
        client = self._get_client()

        comments = []
        page_token = None

        while len(comments) < max_results:
            params = {
                "part": "snippet",
                "videoId": video_id,
                "maxResults": min(100, max_results - len(comments)),
                "order": "relevance",
                "key": self.api_key,
            }
            if page_token:
                params["pageToken"] = page_token

            response = await client.get(f"{YOUTUBE_API_BASE}/commentThreads", params=params)
            response.raise_for_status()
            data = response.json()

            for item in data.get("items", []):
                top = item["snippet"]["topLevelComment"]["snippet"]
                comments.append({
                    "comment_id": item["snippet"]["topLevelComment"]["id"],
                    "author": top["authorDisplayName"],
                    "text": top["textDisplay"],
                    "like_count": top["likeCount"],
                    "published_at": top["publishedAt"],
                })

            page_token = data.get("nextPageToken")
            if not page_token:
                break

        return comments

    async def close(self):
        if self._client:
            await self._client.aclose()
            self._client = None