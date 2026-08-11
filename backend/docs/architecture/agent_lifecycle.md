# Agent Lifecycle

## Overview

Every specialized agent (`RoadDesignAgent`, `WhatsAppAssistant`, `EmailAssistant`) inherits from
`BaseAgent`, which owns three things: the LLM, the MCP client, and the LangGraph workflow. This
document describes how an agent is constructed, initialized, and invoked — and how the pieces
introduced since the original design (per-agent tool scoping, the LLM gateway, context injection,
and memory) fit into that lifecycle.

---

## 1. Construction (`__init__`)

```python
class WhatsAppAssistant(BaseAgent):
    mcp_server_names = ["whats_biz"]

    def __init__(self):
        super().__init__(system_prompt=WHATSAPP_AGENT_SYSTEM_PROMPT)
```

- `mcp_server_names` is a **class-level attribute**, not a constructor argument. It declares which
  MCP server(s) this agent is allowed to load tools from. `BaseAgent` defaults this to `[]`
  (no tools) — every agent must explicitly opt in to a server. There is no implicit "give me
  everything" fallback: an agent that forgets to declare its server list gets zero tools, not
  every other agent's tools. This is a deliberate fail-closed design — an agent silently gaining
  access to another domain's tools (e.g. Road Design calling a WhatsApp-only tool) is a
  correctness/safety risk, not just noise.
- `BaseAgent.__init__` builds:
  - `self.llm` via `build_llm(model, temperature)` — see **LLM Gateway** below, not a raw
    `ChatLiteLLM(...)` call.
  - `self.client = MCPClient()` — not yet connected to any server at this point.
  - `self.graph = None` — the graph is not built yet. Construction is deliberately cheap;
    the expensive part (loading tools, compiling the graph) is deferred to `initialize()`.

---

## 2. Initialization (`initialize()`)

Called once per agent, at platform startup, via `Container.initialize()`:

```python
async def initialize(self):
    tools = await self.client.get_tools(server_names=self.mcp_server_names)
    tools = self._prepare_tools(tools)
    self.graph = create_agent_graph(llm=self.llm, TOOLS=tools, System_Prompt=self.system_prompt)
```

- `MCPClient.get_tools(server_names=...)` loads tools **only** from the servers this agent
  declared. If `server_names` is empty, no `MultiServerMCPClient` is even constructed — the
  function returns `[]` immediately.
- `_prepare_tools(tools)` is a hook subclasses can override to rewrite tool schemas before they're
  bound to the LLM. `WhatsAppAssistant` uses this to strip `conversation_id` out of
  `get_conversation_context`'s LLM-visible schema (see **Context Injection** below) — the LLM is
  never given the option to supply that argument, so it can never hallucinate one.
- `create_agent_graph` compiles the LangGraph `StateGraph` **once**. The compiled graph (and its
  `llm.bind_tools(TOOLS)` closure) is reused for every subsequent invocation — tools are not
  rebound per request.

This step only runs once. If `invoke()` is called before `initialize()` has run, it calls
`initialize()` itself as a safety net.

---

## 3. Graph Shape

```
START → llm_node → tools_condition → [tools] → llm_node → ... → END
```

- `llm_node` invokes the LLM with the system prompt plus accumulated `state["messages"]`.
- `tools_condition` (attached to `llm_node`, not `tools`) checks the LLM's last message for
  `tool_calls`. If present, routes to `tools`; if absent, routes to `END`.
- `tools` (a `ToolNode`) executes whichever tool(s) the LLM called and appends the result(s) as
  `ToolMessage`s, then routes back to `llm_node` so the LLM can incorporate the result.
- This loop repeats until the LLM produces a response with no further tool calls.

---

## 4. Invocation (`invoke()`)

```python
async def invoke(self, query: str, context: dict | None = None) -> AgentResponse:
    context = context or {}
    history = context.get("history", [])

    token = agent_context.set(context)
    try:
        response = await self.graph.ainvoke({
            "messages": [*history, {"role": "user", "content": query}]
        })
    finally:
        agent_context.reset(token)

    return AgentResponse(answer=response["messages"][-1].content, cost=response.get("cost", 0.0))
```

Two distinct mechanisms are at play here, consumed in two different places:

- **`history`** is spliced directly into the graph's initial `messages` state, before the current
  query. The LLM sees these as ordinary prior turns in the conversation — this is how
  cross-message memory reaches the agent. See `memory_architecture.md`.
- **`context` (the whole dict, via `agent_context`)** is set on a `ContextVar` for the duration of
  this one `ainvoke()` call, then reset in a `finally` block (so a failed run can't leak stale
  context into the next request on the same worker). Tools wrapped via `bind_context_arg` read
  this at call time to silently inject values the LLM should never be asked to supply — currently
  `conversation_id`.

`context` and `history` travel together in the same dict from the caller, but are consumed by
two unrelated mechanisms downstream.

---

## 5. Context Injection — Why It Exists

`get_conversation_context(conversation_id)` is an MCP tool the LLM can call. The LLM has no
legitimate way to know a real conversation's UUID — before this mechanism existed, it would
hallucinate one. The fix: `bind_context_arg` (in `app/agent/tool_binding.py`) rewrites the tool's
JSON-schema (MCP tools arrive as raw JSON Schema dicts, not Pydantic models) to remove
`conversation_id` from what the LLM is told the tool accepts. At call time, the wrapped tool reads
the real value from `agent_context.get()` and injects it silently. The LLM calls the tool with
zero arguments; there is nothing for it to hallucinate.

This pattern generalizes to any future caller-known fact (tenant ID, ticket ID, etc.) — wrap the
tool the same way, key it into `context` under a new key.

---

## 6. LLM Gateway

Agents no longer construct `ChatLiteLLM` directly. `BaseAgent.__init__` calls:

```python
self.llm = build_llm(model, temperature=temperature)
```

`build_llm` (in `app/llm/gateway.py`) resolves a **logical** model name (e.g.
`"primary-agent-model"`) to a real provider/model string via `app/llm/model_config.py`, and
attaches a cross-provider fallback chain (OpenAI, then Anthropic, if the primary Groq model
errors or times out). Swapping providers means editing `model_config.py` — no agent code changes.

`register_llm_callbacks()` (called once in `Container.__init__`) registers a LiteLLM
`success_callback` that fires after every completion, reading attribution
(`conversation_id`, etc.) off the same `agent_context` ContextVar described above, for cost
logging.

`graph.py` is unaffected by any of this — it receives a LangChain-compatible chat model and calls
`.bind_tools()` on it, regardless of how that model was constructed underneath.

---

## 7. Full Lifecycle Summary

| Phase | When | What happens |
|---|---|---|
| Construct | Container `__init__` | LLM (via gateway), MCP client, empty graph |
| Initialize | Container `initialize()`, once at startup | Load scoped tools, rewrap via `_prepare_tools`, compile graph |
| Invoke | Every incoming message | Set `agent_context`, seed `history` into state, run graph, reset context |
