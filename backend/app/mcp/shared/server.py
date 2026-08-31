from mcp.server.fastmcp import FastMCP

from app.mcp.shared.tools import (
    knowledge_search,
    web_search,
)

mcp = FastMCP("shared")


@mcp.tool()
def search_knowledge(
    query: str,
    method: str = 'hybrid',
    scope_id: str | None = None,
):
    """
    Search the application's knowledge base for relevant information.
    """

    return knowledge_search(
        query=query,
        method=method,
        scope_id=scope_id,
    )

@mcp.tool()
async def search_web(
    query: str,
    max_results: int = 5,
):
    """
    Search the public web using Tavily.
    """

    return web_search(
        query=query,
        max_results=max_results,
    )


if __name__ == "__main__":
    mcp.run()