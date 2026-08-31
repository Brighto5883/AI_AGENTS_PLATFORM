import shutil
from pathlib import Path

from fastapi import UploadFile

from app.knowledge.document import KnowledgeDocument


class DocumentStorage:

    def __init__(self, root: Path):
        self.root = root
        self.root.mkdir(
            parents=True,
            exist_ok=True,
        )

    async def save_upload(
        self,
        document_id: str,
        file: UploadFile,
        max_size_bytes: int,
        
    ) -> KnowledgeDocument:

        filename = file.filename or "uploaded_document"
        
        safe_filename = Path(filename).name

        if not safe_filename:
            raise ValueError("Uploaded file must have a valid filename.")

        document_dir = self.root / document_id
        document_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        file_path = document_dir / safe_filename

        total_size = 0

        try:

            with file_path.open("wb") as destination:

                while chunk := await file.read(1024 * 1024):

                    total_size += len(chunk)

                    if total_size > max_size_bytes:

                        file_path.unlink(
                            missing_ok=True
                        )

                        raise ValueError(
                            "Uploaded file exceeds "
                            "the maximum allowed size."
                        )

                    destination.write(chunk)

        except Exception:

            file_path.unlink(
                missing_ok=True
            )

            raise

        return KnowledgeDocument(
            document_id=document_id,
            filename=safe_filename,
            path=file_path,
            content_type=file.content_type,
        )

    async def delete(
        self,
        document_id: str,
    ) -> None:

        document_dir = self.root / document_id

        if document_dir.exists():
            shutil.rmtree(document_dir)