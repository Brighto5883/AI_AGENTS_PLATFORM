from mcp.server.fastmcp import FastMCP
from app.mcp.road.resources import get_manuals
from app.mcp.road.tools import (
    hybrid_search,
    vectorless_search,
)

# SERVER
mcp = FastMCP("road_design_server")


# RESOURCES
@mcp.resource("road://manuals")
def manuals_resource():
    return get_manuals()

@mcp.resource("manual://{manual_name}")
def get_manual(manual_name: str):

    manuals = get_manuals()

    for manual in manuals:

        if manual["title"] == manual_name:

            return {
                "title": manual["title"],
                "type": "pdf",
                "content": (
                    "This manual contains engineering guidance "
                    "for Kenyan road design."
                ),
                "source": manual["file_name"],
            }


    return {
        "error": "Manual not found"
    }


# TOOLS
@mcp.tool()
def search_and_summarize(query: str):
    """
    Search the Kenyan Road Design Manuals and return
    a summarized answer.
    """
    return hybrid_search(query)

@mcp.tool()
def vectorless(query: str):
    return vectorless_search(query)


if __name__ == "__main__":
    mcp.run()







# from mcp.server.fastmcp import FastMCP

# from app.mcp.tools.hybrid import hybrid_search

# mcp = FastMCP("road_design_server")


# @mcp.tool(
#     name="hybrid_search",
#     description="Search the Kenyan Road Design manuals."
# )
# def hybrid_search_tool(
#     query: str
# ):
#     return hybrid_search(query)
