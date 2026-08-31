from app.knowledge.retrieval.hybrid import RAGSearch
from app.knowledge.scope_registry import (
    KnowledgeScopeRegistry,
)


class ScopedKnowledgeRetriever:

    def __init__(self):

        self.registry = KnowledgeScopeRegistry()

        self._retrievers: dict[
            str,
            RAGSearch,
        ] = {}

    def search(
        self,
        scope_id: str,
        query: str,
        top_k: int = 5,
    ):

        record = self.registry.get(
            scope_id
        )

        retriever = self._retrievers.get(
            scope_id
        )

        if retriever is None:

            retriever = RAGSearch(
                persist_dir=str(
                    record.vectorstore_path
                )
            )

            self._retrievers[
                scope_id
            ] = retriever

        return retriever.search_and_summarize(
            query=query,
            top_k=top_k,
        )

    def delete(
        self,
        scope_id: str,
    ) -> None:

        self._retrievers.pop(
            scope_id,
            None,
        )
