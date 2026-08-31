from pathlib import Path

from app.knowledge.indexing.embeddings import EmbeddingPipeline
from app.knowledge.indexing.vectorstore import FaissVectorStore


class ScopedIndex:

    def __init__(
        self,
        persist_dir: Path,
        embedding_model: str = "all-MiniLM-L6-v2",
    ):
        self.persist_dir = persist_dir

        self.vectorstore = FaissVectorStore(
            persist_dir=str(persist_dir),
            embedding_model=embedding_model,
        )

        self.embedding_pipeline = EmbeddingPipeline(
            model_name=embedding_model,
        )

    def build(self, documents):
        chunks = self.embedding_pipeline.chunk_documents(
            documents
        )

        self.vectorstore.build_from_documents(
            chunks
        )

        return chunks