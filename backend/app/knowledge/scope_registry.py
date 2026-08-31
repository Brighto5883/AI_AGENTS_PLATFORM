import json
import shutil
from dataclasses import dataclass
from pathlib import Path

from app.core.paths import BACKEND_DIR


@dataclass(frozen=True)
class ScopeRecord:
    scope_id: str
    document_id: str
    document_path: Path
    vectorstore_path: Path
    pageindex_path: Path


class KnowledgeScopeRegistry:

    def __init__(self):

        self.root = ( BACKEND_DIR / "data" / "scoped" )

        self.root.mkdir(
            parents=True,
            exist_ok=True,
        )


    def _scope_dir(
        self,
        scope_id: str,
    ) -> Path:

        return self.root / scope_id
        

    def _manifest_path(
        self,
        scope_id: str,
    ) -> Path:

        return (
            self._scope_dir(scope_id)
            / "manifest.json"
        )


    def register(
        self,
        scope_id: str,
        document_id: str,
        document_path,
    ) -> ScopeRecord:

        scope_dir = self._scope_dir(scope_id)

        vectorstore_path = (
            scope_dir / "vector"
        )

        pageindex_path = (
            scope_dir / "pageindex"
        )

        manifest_path = self._manifest_path(scope_id) # Same to scope_dir/'manifest.json'
                                                      # as the other 2 above

        manifest_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        manifest = {
            "scope_id": scope_id,
            "document_id": document_id,
            "document_path": str(document_path),
            "vectorstore_path": str(vectorstore_path),
            "pageindex_path": str(pageindex_path),
        }

        manifest_path.write_text(
            json.dumps(
                manifest,
                indent=2,
            ),
            encoding="utf-8",
        )

        return ScopeRecord(
            scope_id=manifest["scope_id"],
            document_id=manifest["document_id"],
            document_path=Path(
                manifest["document_path"]
            ),
            vectorstore_path=Path(
                manifest["vectorstore_path"]
            ),
            pageindex_path=Path(
                manifest["pageindex_path"]
            ),
        )


    def get(
        self,
        scope_id: str,
    ) -> ScopeRecord:

        manifest_path = self._manifest_path(
            scope_id
        )

        if not manifest_path.is_file():
            raise KeyError(
                f"Knowledge scope '{scope_id}' does not exist."
            )

        manifest = json.loads(
            manifest_path.read_text(
                encoding="utf-8"
            )
        )

        return ScopeRecord(
            scope_id=manifest["scope_id"],
            document_id=manifest["document_id"],
            document_path=Path(
                manifest["document_path"]
            ),
            vectorstore_path=Path(
                manifest["vectorstore_path"]
            ),
            pageindex_path=Path(
                manifest["pageindex_path"]
            ),
        )


    def delete(
        self,
        scope_id: str,
    ) -> None:

        scope_dir = self._scope_dir(scope_id)

        if scope_dir.exists():
            shutil.rmtree(scope_dir)



