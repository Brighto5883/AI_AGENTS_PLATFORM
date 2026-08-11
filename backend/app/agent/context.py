from contextvars import ContextVar

# Holds facts the calling system already knows for the current agent
# invocation (e.g. conversation_id) that the LLM should never be asked
# to supply itself. Set right before graph.ainvoke(), reset right after.
agent_context: ContextVar[dict | None] = ContextVar("agent_context", default=None)