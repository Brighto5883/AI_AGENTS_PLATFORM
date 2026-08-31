from mcp.server.fastmcp import FastMCP

from app.mcp.road.resources import get_manuals

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


if __name__ == "__main__":
    mcp.run()

