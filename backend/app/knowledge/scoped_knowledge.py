from dataclasses import dataclass
from uuid import uuid4

from fastapi import UploadFile

from app.config.settings import settings
from app.knowledge.indexing.vectorstore import FaissVectorStore
from app.knowledge.ingestion.loader import load_document
from app.knowledge.scope_registry import (
    KnowledgeScopeRegistry,
)
from app.knowledge.scoped_storage import DocumentStorage


@dataclass(frozen=True)
class KnowledgeScope:
    """
    Represents temporary knowledge belonging to one execution scope.
    """
    scope_id: str
    document_id: str


class ScopedKnowledgeService:

    def __init__(self):

        self.registry = KnowledgeScopeRegistry()

    async def create_scope(
        self,
        file: UploadFile,
    ) -> KnowledgeScope:

        scope_id = str(uuid4())
        document_id = str(uuid4())

        scope_dir = self.registry._scope_dir(scope_id)

        document_storage = DocumentStorage(
            root=scope_dir / "documents",
        )

        try:

            document = await document_storage.save_upload(
                document_id=document_id,
                file=file,
                max_size_bytes=(
                    settings.MAX_UPLOAD_SIZE_BYTES
                ),
            )

            documents = load_document(
                document.path
            )

            vectorstore = FaissVectorStore(
                persist_dir=str(
                    scope_dir / "vector"
                ),
            )

            vectorstore.build_from_documents(
                documents
            )

            self.registry.register(
                scope_id=scope_id,
                document_id=document_id,
                document_path=document.path,
            )

            return KnowledgeScope(
                scope_id=scope_id,
                document_id=document_id,
            )

        except Exception:

            self.registry.delete(
                scope_id
            )

            raise

        finally:

            await file.close()

    async def delete_scope(
        self,
        scope_id: str,
    ) -> None:

        self.registry.delete(
            scope_id
        )
