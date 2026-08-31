import logging

from tavily import AsyncTavilyClient

from app.config.settings import settings
from app.knowledge.retrieval.hybrid import RAGSearch
from app.knowledge.retrieval.scoped_retrieval import (
    ScopedKnowledgeRetriever,
)
from app.knowledge.retrieval.vectorless import (
    get_pageindex_tree,
    vectorless_rag,
)

logger = logging.getLogger(__name__)

_tavily = AsyncTavilyClient(
    api_key=settings.TAVILY_API_KEY,
)


_rag: RAGSearch | None = None
_scoped_retriever = ScopedKnowledgeRetriever()
_pageindex_tree = None


def knowledge_search(
    query: str,
    method: str = "hybrid",
    scope_id: str | None = None,
):
    """
    Search application knowledge.

    Global knowledge is always available.

    If scope_id is supplied, the corresponding temporary
    scoped knowledge is searched as well.
    """

    global _rag
    global _pageindex_tree

    logger.info(
        "Knowledge search requested: method=%s scope=%s",
        method,
        bool(scope_id),
    )

    if method == "hybrid":

        if _rag is None:
            _rag = RAGSearch()

        global_result=_rag.search_and_summarize(
            query
        )

        if scope_id is None:
            return global_result

        scoped_result = _scoped_retriever.search(
            scope_id=scope_id,
            query=query,
        )

        return {
            "query": query,
            "context": (
                "GLOBAL KNOWLEDGE:\n"
                f"{global_result['context']}\n\n"
                "UPLOADED DOCUMENT:\n"
                f"{scoped_result['context']}"
            ),
            "documents": [
                *global_result["documents"],
                *scoped_result["documents"],
            ],
        }

    if method == "vectorless":

        if _pageindex_tree is None:
            _pageindex_tree = get_pageindex_tree()

        return vectorless_rag(
            query=query,
            tree=_pageindex_tree,
        )

    raise ValueError(
        f"Unsupported knowledge search method: {method}"
    )

async def web_search(
    query: str,
    max_results: int = 5,
):
    """
    Search the public web for current information.
    """

    global _tavily

    if _tavily is None:
        _tavily = AsyncTavilyClient(
            api_key=settings.TAVILY_API_KEY
        )

    logger.info(
        "Web search requested"
    )

    return await _tavily.search(
        query=query,
        max_results=max_results,
        search_depth="advanced",
    )