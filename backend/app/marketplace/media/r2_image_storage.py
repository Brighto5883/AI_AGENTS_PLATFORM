import asyncio
from typing import BinaryIO

import boto3

from app.marketplace.media.image_storage import ImageStorage
from app.marketplace.media.schemas import StoredImage


class R2ImageStorage(ImageStorage):
    def __init__(
        self,
        *,
        endpoint_url: str,
        access_key_id: str,
        secret_access_key: str,
        bucket_name: str,
        region: str = "auto",
    ) -> None:
        self.bucket_name = bucket_name

        self.client = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            region_name=region,
        )

    async def save(
        self,
        *,
        file: BinaryIO,
        storage_key: str,
        content_type: str,
    ) -> StoredImage:

        file_size = self._get_file_size(file)

        await asyncio.to_thread(
            self.client.upload_fileobj,
            file,
            self.bucket_name,
            storage_key,
            ExtraArgs={
                "ContentType": content_type,
                "CacheControl": (
                    "public, max-age=31536000, immutable"
                ),
            },
        )

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

        await asyncio.to_thread(
            self.client.delete_object,
            Bucket=self.bucket_name,
            Key=storage_key,
        )

    async def get_access_url(
        self,
        *,
        storage_key: str,
        expires_in: int,
    ) -> str:

        return await asyncio.to_thread(
            self.client.generate_presigned_url,
            "get_object",
            Params={
                "Bucket": self.bucket_name,
                "Key": storage_key,
            },
            ExpiresIn=expires_in,
        )

    @staticmethod
    def _get_file_size(
        file: BinaryIO,
    ) -> int:
        file.seek(0, 2)
        size = file.tell()
        file.seek(0)
        return size