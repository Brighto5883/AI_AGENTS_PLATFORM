Official MCP SDK (resources, tools, prompts, transports) — you're already here.
Claude Desktop integration — to see how external clients consume your server.
Cursor MCP integration — useful for AI-assisted development workflows.
mcp-use — understand it as a higher-level abstraction and compare it with your LangGraph approach.
SSE transport — for remote and multi-client deployments.
Multi-server orchestration — running and combining several specialized MCP servers from a single agent.

        HARDENING ROADMAP
Feedback UX → H1 Architecture Audit → H2 Auth/Security → H3 Validation → H4 Marketplace → H5 Payments → H6 Storage → H7 Errors → H8 DB/Concurrency → H9 Rate Limits → H10 Observability → Production readiness.



      FUTURE TASKS
1. Omit method argument from the /query endpoint and the frontend as well.
2.Before production, we should add the appropriate verification/reconciliation strategy and carefully handle callback authenticity and duplicate events.