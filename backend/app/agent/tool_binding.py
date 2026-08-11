import copy

from langchain_core.tools import StructuredTool
from app.agent.context import agent_context


def bind_context_arg(tool: StructuredTool, arg_name: str, context_key: str) -> StructuredTool:
    """
    Returns a copy of `tool` with `arg_name` removed from its LLM-visible
    schema. At call time, the value is pulled from the current request's
    agent_context (set by BaseAgent.invoke) instead of from the model.

    Handles MCP-sourced tools, whose args_schema is a raw JSON Schema dict
    (not a Pydantic model) — MCP itself is schema-agnostic, so tools loaded
    via langchain_mcp_adapters always arrive this way.

    Use this for any parameter the caller already knows with certainty
    (conversation IDs, tenant IDs, ticket IDs...) — never let the LLM
    guess a value it has no legitimate way to know.
    """
    new_schema = copy.deepcopy(tool.args_schema)

    if isinstance(new_schema, dict):
        new_schema.get("properties", {}).pop(arg_name, None)
        if "required" in new_schema and arg_name in new_schema["required"]:
            new_schema["required"].remove(arg_name)
    else:
        # Pydantic BaseModel-based schema (native LangChain tools)
        remaining_fields = {
            name: (field.annotation, field)
            for name, field in new_schema.model_fields.items()
            if name != arg_name
        }
        from pydantic import create_model
        new_schema = create_model(f"{tool.name}_BoundArgs", **remaining_fields)

    async def wrapped(**kwargs):
        ctx = agent_context.get() or {}
        if context_key not in ctx:
            raise ValueError(
                f"Tool '{tool.name}' requires '{context_key}' in agent context, "
                f"but none was provided to invoke()."
            )
        kwargs[arg_name] = ctx[context_key]
        return await tool.coroutine(**kwargs)

    return StructuredTool(
        name=tool.name,
        description=tool.description,
        args_schema=new_schema,
        coroutine=wrapped,
    )