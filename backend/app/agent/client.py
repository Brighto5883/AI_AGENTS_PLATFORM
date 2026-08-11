from langchain_mcp_adapters.client import MultiServerMCPClient
import json
from pathlib import Path
from app.core.paths import CONFIG_PATH


class MCPClient:

    def __init__(self):

        config = CONFIG_PATH

        with open(config) as f:
            self.config = json.load(f)['mcpServers']

    async def get_tools(self, server_names: list[str] | None = None):
        """
        Only loads tools from explicitly named servers. An agent that
        declares no server names gets NO tools — never a silent fallback
        to "everything" — since an agent holding tools it was never
        designed for is a real correctness/safety risk, not just noise.
        """
        server_names = server_names or []

        if not server_names:
            return []

        scoped_config = {
                name: cfg for name, cfg in self.config.items() if name in server_names
            }

        if not scoped_config:
            return [] # named a server that isn't in servers.json — fail safe, not silently-all


        client = MultiServerMCPClient(scoped_config)

        return await client.get_tools()