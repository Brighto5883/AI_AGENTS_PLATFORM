from abc import ABC, abstractmethod
from typing import BinaryIO

from app.marketplace.media.schemas import StoredImage


class ImageStorage(ABC):

    @abstractmethod
    async def save(
        self,
        *,
        file: BinaryIO,
        storage_key: str,
        content_type: str,
    ) -> StoredImage:
        raise NotImplementedError

    @abstractmethod
    async def delete(
        self,
        *,
        storage_key: str,
    ) -> None:
        raise NotImplementedError

    @abstractmethod
    async def get_access_url(
        self,
        *,
        storage_key: str,
        expires_in: int,
    ) -> str:
        raise NotImplementedError