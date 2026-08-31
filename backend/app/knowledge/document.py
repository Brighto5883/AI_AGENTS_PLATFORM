from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class KnowledgeDocument:
    """
    Represents a stored document that can participate in knowledge retrieval.
    """

    document_id: str
    filename: str
    path: Path
    content_type: str | None