import os
import litellm
import numpy as np
from pathlib import Path
from dotenv import load_dotenv
from rank_bm25 import BM25Okapi  # NEW: BM25 keyword search
from app.knowledge.indexing.vectorstore import FaissVectorStore

load_dotenv(override=True)

class RAGSearch:
    def __init__(self, persist_dir: str = "faiss_store", embedding_model: str = "all-MiniLM-L6-v2"):
        self.vectorstore = FaissVectorStore(persist_dir, embedding_model)

        # Load or build vectorstore
        faiss_path = os.path.join(persist_dir, "faiss.index")
        meta_path = os.path.join(persist_dir, "metadata.pkl")
        if not (os.path.exists(faiss_path) and os.path.exists(meta_path)):
            from app.knowledge.ingestion.loader import load_all_documents
            docs = load_all_documents("data")
            self.vectorstore.build_from_documents(docs)
        else:
            self.vectorstore.load()

        # NEW: Build BM25 index from the same chunks used in vector store
        # Tokenise each chunk's text by splitting on whitespace
        chunk_texts = [chunk.page_content for chunk in self.vectorstore.chunks]
        tokenized_chunks = [text.lower().split() for text in chunk_texts]
        self.bm25 = BM25Okapi(tokenized_chunks)
        self.chunk_texts = chunk_texts  # keep plain texts for context assembly
        print(f"[INFO] BM25 index built over {len(chunk_texts)} chunks.")

    # NEW: BM25 keyword search — returns ranked list of chunk indices
    def _bm25_search(self, query: str, top_k: int = 5):
        tokenized_query = query.lower().split()
        scores = self.bm25.get_scores(tokenized_query)
        # Get indices of top_k highest scores
        top_indices = np.argsort(scores)[::-1][:top_k]
        return [
            {"index": int(idx), "score": float(scores[idx])}
            for idx in top_indices
        ]

    # NEW: Reciprocal Rank Fusion — merges vector and BM25 results
    def _rrf_merge(self, vector_results, bm25_results, top_k: int = 5, k: int = 60):
        """
        k=60 is the standard RRF constant.
        Score formula: 1 / (k + rank_position)
        Chunks appearing in both result lists get scores from both — they rise to the top.
        """
        rrf_scores = {}

        # Score vector results by their rank position
        for rank, result in enumerate(vector_results):
            idx = result["index"]
            rrf_scores[idx] = rrf_scores.get(idx, 0) + 1 / (k + rank + 1)

        # Score BM25 results by their rank position
        for rank, result in enumerate(bm25_results):
            idx = result["index"]
            rrf_scores[idx] = rrf_scores.get(idx, 0) + 1 / (k + rank + 1)

        # Sort by combined RRF score — highest first
        sorted_indices = sorted(rrf_scores.keys(), key=lambda x: rrf_scores[x], reverse=True)
        return sorted_indices[:top_k]

    def search_and_summarize(self, query: str, top_k: int = 5):
        """
        Retrieve relevant context only.
        No LLM.
        No LangGraph.
        """

        vector_results = self.vectorstore.query(
            query,
            top_k=top_k,
        )

        bm25_results = self._bm25_search(
            query,
            top_k=top_k,
        )

        merged_indices = self._rrf_merge(
            vector_results,
            bm25_results,
            top_k=top_k,
        )

        texts = [
            self.chunk_texts[idx]
            for idx in merged_indices
            if idx < len(self.chunk_texts)
        ]

        context = "\n\n".join(texts)

        documents = list(
            {
                Path(result["metadata"]["source"]).name
                for result in vector_results
            }
        )

        return {
            "query": query,
            "context": context,
            "documents": documents,
        }

# Example usage
if __name__ == "__main__":
    rag_search = RAGSearch()
    query = "What is attention mechanism?"
    summary = rag_search.search_and_summarize(query, top_k=3)
    print("Summary:", summary)