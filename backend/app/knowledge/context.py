from dataclasses import dataclass


@dataclass(frozen=True)
class KnowledgeContext:
    """
    Defines the knowledge available during a single agent execution.

    Global knowledge is always available.

    If scope_id is provided, the execution also has access to temporary 
    request-scoped knowledge.
    """

    scope_id: str | None = None
    uploaded_document_id: str | None = None