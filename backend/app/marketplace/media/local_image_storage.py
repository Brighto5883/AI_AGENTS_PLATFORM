# app/marketplace/media/local_image_storage.py

from pathlib import Path
from typing import BinaryIO

from app.marketplace.media.image_storage import ImageStorage
from app.marketplace.media.schemas import StoredImage


class LocalImageStorage(ImageStorage):
    def __init__(
        self,
        *,
        base_directory: Path,
        base_url: str,
    ) -> None:
        self.base_directory = base_directory
        self.base_url = base_url.rstrip("/")

    async def save(
        self,
        *,
        file: BinaryIO,
        storage_key: str,
        content_type: str,
    ) -> StoredImage:
        destination = self.base_directory / storage_key

        destination.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        file_size = 0

        with destination.open("wb") as destination_file:
            while chunk := file.read(1024 * 1024):
                destination_file.write(chunk)
                file_size += len(chunk)

        return StoredImage(
            storage_key=storage_key,
            content_type=content_type,
            file_size=file_size,
        )

    async def delete(
        self,
        *,
        storage_key: str,
    ) -> None:
        destination = self.base_directory / storage_key

        if destination.exists():
            destination.unlink()

    async def get_access_url(
        self,
        *,
        storage_key: str,
        expires_in: int,
    ) -> str:
        return f"{self.base_url}/media/{storage_key}"