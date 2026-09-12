from dataclasses import dataclass
from io import BytesIO
from typing import BinaryIO


@dataclass(frozen=True)
class ImageUpload:
    file: BinaryIO
    original_filename: str
    content_type: str


@dataclass(frozen=True)
class ProcessedImage:
    file: BytesIO
    content_type: str
    file_size: int

@dataclass(frozen=True)
class StoredImage:
    storage_key: str
    content_type: str
    file_size: int