from uuid import uuid4

from fastapi import UploadFile

from app.config.settings import settings
from app.core.paths import TEMP_DOCUMENTS_DIR
from app.knowledge.document import KnowledgeDocument
from app.knowledge.scoped_storage import DocumentStorage


class DocumentService:

    def __init__(self):
        self.storage = DocumentStorage(TEMP_DOCUMENTS_DIR)

    async def save_upload(
        self,
        file: UploadFile,
    ) -> KnowledgeDocument:

        document_id = str(uuid4())

        try:
            return await self.storage.save_upload(
                document_id=document_id,
                file=file,
                max_size_bytes=settings.MAX_UPLOAD_SIZE_BYTES,
            )
        finally:
            await file.close()

    async def delete(
        self,
        document_id: str,
    ) -> None:

        await self.storage.delete(document_id)