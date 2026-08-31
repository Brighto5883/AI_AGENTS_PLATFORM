import os
import pickle
from pathlib import Path
from typing import Any

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

from app.core.paths import FAISS_DIR
from app.knowledge.indexing.embeddings import EmbeddingPipeline


class FaissVectorStore:
    def __init__(
        self,
        persist_dir: str | Path = FAISS_DIR,
        embedding_model: str = "all-MiniLM-L6-v2",
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
    ):
        self.persist_dir = Path(persist_dir)
        self.persist_dir.mkdir(parents=True, exist_ok=True)

        self.index: faiss.Index | None = None
        self.metadata: list[Any] = []
        self.chunks: list[Any] = []

        self.embedding_model = embedding_model
        self.model = SentenceTransformer(embedding_model)

        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

        print(f"[INFO] Loaded embedding model: {embedding_model}")

    def build_from_documents(
        self,
        documents: list[Any],
    ):
        """
        Build the vector store from raw LangChain documents.

        Chunking is performed exactly once by EmbeddingPipeline.
        """

        print(
            f"[INFO] Building vector store from "
            f"{len(documents)} raw documents..."
        )

        emb_pipe = EmbeddingPipeline(
            model_name=self.embedding_model,
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
        )

        chunks = emb_pipe.chunk_documents(documents)

        return self.build_from_chunks(
            chunks,
            embedding_pipeline=emb_pipe,
        )

    def build_from_chunks(
        self,
        chunks: list[Any],
        embedding_pipeline: EmbeddingPipeline | None = None,
    ):
        """
        Build the vector store from documents that have already
        been chunked.

        This method NEVER chunks the input.
        """

        if embedding_pipeline is None:
            embedding_pipeline = EmbeddingPipeline(
                model_name=self.embedding_model,
                chunk_size=self.chunk_size,
                chunk_overlap=self.chunk_overlap,
            )

        self.chunks = chunks

        embeddings = embedding_pipeline.embed_chunks(chunks)

        metadatas = []

        for chunk in chunks:
            metadata = chunk.metadata.copy()
            metadata["text"] = chunk.page_content
            metadatas.append(metadata)

        self.add_embeddings(
            np.asarray(
                embeddings,
                dtype="float32",
            ),
            metadatas,
        )

        self.save()

        print(
            f"[INFO] Vector store built and saved to "
            f"{self.persist_dir}"
        )

    def add_embeddings(
        self,
        embeddings: np.ndarray,
        metadatas: list[Any] | None = None,
    ):
        dim = embeddings.shape[1]

        if self.index is None:
            self.index = faiss.IndexFlatL2(dim)

        self.index.add(embeddings)

        if metadatas:
            self.metadata.extend(metadatas)

        print(
            f"[INFO] Added {embeddings.shape[0]} "
            f"vectors to Faiss index."
        )

    def save(self):
        if self.index is None:
            raise RuntimeError("Cannot save an empty FAISS index.")

        faiss_path = self.persist_dir / "faiss.index"
        meta_path = self.persist_dir / "metadata.pkl"
        chunks_path = self.persist_dir / "chunks.pkl"

        faiss.write_index(self.index, os.fspath(faiss_path))

        with open(meta_path, "wb") as f:
            pickle.dump(self.metadata, f)

        with open(chunks_path, "wb") as f:
            pickle.dump(self.chunks, f)

        print(
            f"[INFO] Saved Faiss index, metadata, "
            f"and chunks to {self.persist_dir}"
        )

    def load(self):
        faiss_path = self.persist_dir / "faiss.index"
        meta_path = self.persist_dir / "metadata.pkl"
        chunks_path = self.persist_dir / "chunks.pkl"

        self.index = faiss.read_index(
            os.fspath(faiss_path)
        )

        with open(meta_path, "rb") as f:
            self.metadata = pickle.load(f)

        if os.path.exists(chunks_path):
            with open(chunks_path, "rb") as f:
                self.chunks = pickle.load(f)
        else:
            self.chunks = [
                type(
                    "Chunk",
                    (),
                    {"page_content": m["text"]},
                )()
                for m in self.metadata
            ]

            print(
                "[WARN] chunks.pkl not found — reconstructed "
                "from metadata. Re-run build_from_documents "
                "to fix."
            )

        print(
            f"[INFO] Loaded Faiss index, metadata, "
            f"and chunks from {self.persist_dir}"
        )

    def search(
        self,
        query_embedding: np.ndarray,
        top_k: int = 5,
    ):
        if self.index is None:
            raise RuntimeError(
                "FAISS index has not been built or loaded."
            )

        distances, indices = self.index.search(
            query_embedding,
            top_k,
        )

        results = []

        for idx, dist in zip(
            indices[0],
            distances[0],
            strict=False,
        ):
            meta = (
                self.metadata[idx]
                if idx < len(self.metadata)
                else None
            )

            results.append(
                {
                    "index": idx,
                    "distance": dist,
                    "metadata": meta,
                }
            )

        return results

    def query(
        self,
        query_text: str,
        top_k: int = 5,
    ):
        print(
            f"[INFO] Querying vector store for: "
            f"'{query_text}'"
        )

        query_emb = self.model.encode(
            [query_text]
        ).astype("float32")

        return self.search(
            query_emb,
            top_k=top_k,
        )


if __name__ == "__main__":
    from app.knowledge.ingestion.loader import load_all_documents

    docs = load_all_documents()

    store = FaissVectorStore("faiss_store")

    store.build_from_documents(docs)
    store.load()

    print(
        store.query(
            "What is attention mechanism?",
            top_k=3,
        )
    )
