from app.knowledge.retrieval.hybrid import RAGSearch
from app.knowledge.retrieval.vectorless import (
    get_pageindex_tree,
    vectorless_rag,
)

tree = None

rag = None

def hybrid_search(query: str):
    global rag

    if rag is None:
        rag = RAGSearch()
        
    return rag.search_and_summarize(query)

def vectorless_search(query: str):
    """
    Retrieve context using PageIndex.
    """
    global tree

    if tree is None:
        tree = get_pageindex_tree()

    return vectorless_rag(
        query=query,
        tree=tree,
    )