import asyncio
from io import BytesIO
from pathlib import Path
from typing import BinaryIO

from PIL import Image, ImageOps, UnidentifiedImageError
from PIL.Image import DecompressionBombError

from app.marketplace.media.schemas import ImageUpload, ProcessedImage


class InvalidImageError(ValueError):
    pass


class ImageProcessor:

    ALLOWED_FORMATS = {
        "JPEG",
        "PNG",
        "WEBP",
    }

    ALLOWED_CONTENT_TYPES = {
        "image/jpeg",
        "image/png",
        "image/webp",
    }

    def __init__(
        self,
        *,
        max_upload_size_bytes: int,
        max_width: int,
        max_height: int,
    ) -> None:
        self.max_upload_size_bytes = max_upload_size_bytes
        self.max_width = max_width
        self.max_height = max_height


    async def process(
        self,
        upload: ImageUpload,
    ) -> ProcessedImage:
        return await asyncio.to_thread(
            self._process_sync,
            upload,
        )


    def _process_sync(
        self,
        upload: ImageUpload,
    ) -> ProcessedImage:

        self._validate_content_type(upload.content_type)

        original_filename = Path(upload.original_filename).name

        if not original_filename:
            raise InvalidImageError(
                "Image filename is invalid."
            )

        file_size = self._get_file_size(upload.file)

        if file_size > self.max_upload_size_bytes:
            raise InvalidImageError(
                f"Image exceeds the maximum allowed file size: {file_size}"
            )

        try:
            data = upload.file.read()

            image = Image.open(BytesIO(data))

            detected_format = image.format

            if detected_format not in self.ALLOWED_FORMATS:
                raise InvalidImageError(
                    f"Unsupported image format: {detected_format}"
                )

            if image.width > self.max_width:
                raise InvalidImageError(
                    f"Image width exceeds the maximum allowed dimension: {image.width}"
                )

            if image.height > self.max_height:
                raise InvalidImageError(
                    f"Image height exceeds the maximum allowed dimension: {image.height}"
                )

            if image.width * image.height > (
                self.max_width * self.max_height
            ):
                raise InvalidImageError(
                    "Image contains too many pixels"
                )

            if getattr(image, "is_animated", False):
                raise InvalidImageError(
                    "Animated images are not supported."
                )

            image.verify()

            upload.file.seek(0)

            image = Image.open(BytesIO(data))

            image = ImageOps.exif_transpose(image)

            if (
                image.mode in ("RGBA", "LA")
                or "transparency" in image.info
            ):
                image = image.convert("RGBA")
            else:
                image = image.convert("RGB")

            image.thumbnail(
                (self.max_width, self.max_height),
                Image.Resampling.LANCZOS,
            )

            output = BytesIO()

            image.save(
                output,
                format="WEBP",
                quality=85,
                method=6,
            )

            output.seek(0)

            return ProcessedImage(
                file=output,
                content_type="image/webp",
                file_size=output.getbuffer().nbytes,
            )

        except (
            UnidentifiedImageError,
            DecompressionBombError,
        ) as exc:
            raise InvalidImageError(
                "The uploaded file is not a valid image."
            ) from exc

    def _validate_content_type(
        self,
        content_type: str,
    ) -> None:
        if content_type.lower() not in self.ALLOWED_CONTENT_TYPES:
            raise InvalidImageError(
                "Unsupported Content Type. Only JPEG, PNG, and WebP images are allowed."
            )

    @staticmethod
    def _get_file_size(file: BinaryIO) -> int:
        current_position = file.tell()

        file.seek(0, 2)
        size = file.tell()

        file.seek(0)

        if current_position != 0:
            file.seek(0)

        return size

