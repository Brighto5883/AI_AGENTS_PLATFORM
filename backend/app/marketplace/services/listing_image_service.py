import asyncio
import uuid
from collections.abc import Sequence
from typing import cast

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models.listing_image import ListingImage
from app.marketplace.media.image_processing import (
    ImageProcessor,
    ImageUpload,
    InvalidImageError,
)
from app.marketplace.media.image_storage import ImageStorage
from app.marketplace.moderation.image_scanner import ImageContactScanner

StoredUpload = tuple[ImageUpload, str, str, int]


class ListingImageService:
    def __init__(
        self,
        *,
        image_storage: ImageStorage,
        image_processor: ImageProcessor,
        max_images: int,
        url_expiration_seconds: int,
        image_scanner: ImageContactScanner | None,
    ) -> None:
        self.image_storage = image_storage
        self.image_processor = image_processor
        self.max_images = max_images
        self.url_expiration_seconds = url_expiration_seconds
        self.image_scanner = image_scanner

    async def create_images(
        self,
        *,
        listing_id: uuid.UUID,
        uploads: Sequence[ImageUpload],
        session: AsyncSession,
        scan_for_contact: bool = False,
    ) -> tuple[list[ListingImage], list[str]]:
        if len(uploads) > self.max_images:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"A listing can have at most "
                    f"{self.max_images} images."
                ),
            )

        images: list[ListingImage] = []
        stored_keys: list[str] = []

        try:
            for upload in uploads:
                self._scan_for_contact_if_required(
                    upload=upload,
                    scan_for_contact=scan_for_contact,
                )

            async def process_and_store(
                upload: ImageUpload,
            ) -> tuple[ImageUpload, str, str, int]:
                processed = await self.image_processor.process(upload)

                storage_key = (
                    f"listings/"
                    f"{listing_id}/"
                    f"{uuid.uuid4()}.webp"
                )

                await self.image_storage.save(
                    file=processed.file,
                    storage_key=storage_key,
                    content_type=processed.content_type,
                )

                return (
                    upload,
                    storage_key,
                    processed.content_type,
                    processed.file_size,
                )

            # Image processing and R2 uploads are independent. Running them
            # concurrently removes the previous one-image-at-a-time wait.
            results = await asyncio.gather(
                *(process_and_store(upload) for upload in uploads),
                return_exceptions=True,
            )

            successful_results: list[StoredUpload] = []
            failures: list[BaseException] = []

            for result in results:
                if isinstance(result, BaseException):
                    failures.append(result)
                else:
                    successful_results.append(cast(StoredUpload, result))

            if failures:
                await self._cleanup_storage(
                    [result[1] for result in successful_results],
                )
                raise failures[0]

            for display_order, (
                upload,
                storage_key,
                content_type,
                file_size,
            ) in enumerate(successful_results):
                stored_keys.append(storage_key)

                image = ListingImage(
                    listing_id=listing_id,
                    storage_key=storage_key,
                    original_filename=upload.original_filename,
                    content_type=content_type,
                    file_size=file_size,
                    display_order=display_order,
                )

                session.add(image)
                images.append(image)

            return images, stored_keys

        except InvalidImageError as exc:
            await self._cleanup_storage(stored_keys)
            raise HTTPException(
                status_code=400,
                detail=str(exc),
            ) from exc

        except Exception:
            await self._cleanup_storage(stored_keys)
            raise

    async def add_images(
        self,
        *,
        listing_id: uuid.UUID,
        uploads: Sequence[ImageUpload],
        session: AsyncSession,
        scan_for_contact: bool = False,
    ) -> list[ListingImage]:
        if not uploads:
            return []

        existing_images_result = await session.execute(
            select(ListingImage)
            .where(
                ListingImage.listing_id == listing_id,
            )
            .order_by(ListingImage.display_order.asc())
        )

        existing_images = existing_images_result.scalars().all()

        total_images = len(existing_images) + len(uploads)

        if total_images > self.max_images:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"A listing can have at most "
                    f"{self.max_images} images. "
                    f"This listing already has "
                    f"{len(existing_images)} images."
                ),
            )

        next_display_order = len(existing_images)

        images: list[ListingImage] = []
        stored_keys: list[str] = []

        try:
            for upload in uploads:
                self._scan_for_contact_if_required(
                    upload=upload,
                    scan_for_contact=scan_for_contact,
                )

            async def process_and_store(
                upload: ImageUpload,
            ) -> tuple[ImageUpload, str, str, int]:
                processed = await self.image_processor.process(upload)

                storage_key = (
                    f"listings/"
                    f"{listing_id}/"
                    f"{uuid.uuid4()}.webp"
                )

                await self.image_storage.save(
                    file=processed.file,
                    storage_key=storage_key,
                    content_type=processed.content_type,
                )

                return (
                    upload,
                    storage_key,
                    processed.content_type,
                    processed.file_size,
                )

            results = await asyncio.gather(
                *(process_and_store(upload) for upload in uploads),
                return_exceptions=True,
            )

            successful_results: list[StoredUpload] = []
            failures: list[BaseException] = []

            for result in results:
                if isinstance(result, BaseException):
                    failures.append(result)
                else:
                    successful_results.append(cast(StoredUpload, result))

            if failures:
                await self._cleanup_storage(
                    [result[1] for result in successful_results],
                )
                raise failures[0]

            for index, (
                upload,
                storage_key,
                content_type,
                file_size,
            ) in enumerate(successful_results):
                stored_keys.append(storage_key)

                image = ListingImage(
                    listing_id=listing_id,
                    storage_key=storage_key,
                    original_filename=upload.original_filename,
                    content_type=content_type,
                    file_size=file_size,
                    display_order=next_display_order + index,
                )

                session.add(image)
                images.append(image)

            await session.flush()

            return images

        except InvalidImageError as exc:
            await self._cleanup_storage(stored_keys)
            raise HTTPException(
                status_code=400,
                detail=str(exc),
            ) from exc

        except Exception:
            await self._cleanup_storage(stored_keys)
            raise

    def _scan_for_contact_if_required(
        self,
        *,
        upload: ImageUpload,
        scan_for_contact: bool,
    ) -> None:
        if not scan_for_contact:
            return

        if self.image_scanner is None:
            raise HTTPException(
                status_code=500,
                detail="Image contact scanning is not configured.",
            )

        scan_result = self.image_scanner.scan(upload.file)

        if not scan_result["passed"]:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": (
                        "Image contains prohibited contact information."
                    ),
                    "reason": scan_result["reason"],
                    "flagged": scan_result["flagged"],
                },
            )

    async def get_image_url(
        self,
        *,
        image: ListingImage,
    ) -> str:
        return await self.image_storage.get_access_url(
            storage_key=image.storage_key,
            expires_in=self.url_expiration_seconds,
        )

    async def _cleanup_storage(
        self,
        storage_keys: Sequence[str],
    ) -> None:
        for storage_key in storage_keys:
            await self.image_storage.delete(
                storage_key=storage_key,
            )

    async def get_storage_keys(
        self,
        *,
        listing_id: uuid.UUID,
        session: AsyncSession,
    ) -> list[str]:
        result = await session.execute(
            select(ListingImage.storage_key)
            .where(
                ListingImage.listing_id == listing_id,
            )
        )

        return list(result.scalars().all())

    async def delete_image(
        self,
        *,
        image_id: uuid.UUID,
        listing_id: uuid.UUID,
        session: AsyncSession,
    ) -> None:
        image = await session.get(
            ListingImage,
            image_id,
        )

        if image is None or image.listing_id != listing_id:
            raise HTTPException(
                status_code=404,
                detail="Listing image not found.",
            )

        storage_key = image.storage_key

        await session.delete(image)
        await session.flush()

        remaining_images_result = await session.execute(
            select(ListingImage)
            .where(
                ListingImage.listing_id == listing_id,
            )
            .order_by(ListingImage.display_order.asc())
        )

        remaining_images = remaining_images_result.scalars().all()

        for display_order, remaining_image in enumerate(
            remaining_images
        ):
            remaining_image.display_order = display_order

        await session.commit()

        try:
            await self.image_storage.delete(
                storage_key=storage_key,
            )
        except Exception:
            return

    async def delete_storage_objects(
        self,
        *,
        storage_keys: Sequence[str],
    ) -> None:
        for storage_key in storage_keys:
            try:
                await self.image_storage.delete(
                    storage_key=storage_key,
                )
            except Exception:
                continue