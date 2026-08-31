import copy
from collections.abc import Awaitable, Callable
from typing import Any, cast

from langchain_core.tools import StructuredTool
from pydantic import BaseModel, create_model

from app.agent.context import agent_context


def _create_bound_model(
    tool_name: str,
    fields: dict[str, tuple[Any, Any]],
) -> type[BaseModel]:
    """
    Dynamically create a Pydantic model containing the remaining tool fields.

    Pydantic's create_model() is intentionally dynamic, while its static type
    signature cannot fully express arbitrary field-definition kwargs.
    """
    create_model_dynamic = cast(Callable[..., type[BaseModel]], create_model)

    return create_model_dynamic(
        f"{tool_name}_BoundArgs",
        **fields,
    )


def bind_context_arg(
    tool: StructuredTool,
    arg_name: str,
    context_key: str,
) -> StructuredTool:
    """
    Returns a copy of `tool` with `arg_name` removed from its LLM-visible
    schema. At call time, the value is pulled from the current request's
    agent_context instead of from the model.

    Handles MCP-sourced tools, whose args_schema is a raw JSON Schema dict,
    as well as native LangChain tools using Pydantic schemas.
    """
    new_schema = copy.deepcopy(tool.args_schema)

    if isinstance(new_schema, dict):
        properties = new_schema.get("properties")

        if isinstance(properties, dict):
            properties.pop(arg_name, None)

        required = new_schema.get("required")

        if isinstance(required, list):
            if arg_name in required:
                required.remove(arg_name)

    elif isinstance(new_schema, type) and issubclass(new_schema, BaseModel):
        remaining_fields = {
            name: (field.annotation, field)
            for name, field in new_schema.model_fields.items()
            if name != arg_name
        }

        new_schema = _create_bound_model(
            tool.name,
            remaining_fields,
        )

    else:
        raise TypeError(
            f"Unsupported args_schema type for tool '{tool.name}': "
            f"{type(new_schema)!r}"
        )

    async def wrapped(**kwargs: Any) -> Any:
        ctx = agent_context.get() or {}

        if context_key not in ctx:
            raise ValueError(
                f"Tool '{tool.name}' requires '{context_key}' in agent context, "
                "but none was provided to invoke()."
            )

        kwargs[arg_name] = ctx[context_key]

        coroutine = tool.coroutine

        if coroutine is None:
            raise RuntimeError(
                f"Tool '{tool.name}' does not provide an async coroutine."
            )

        return await coroutine(**kwargs)

    return StructuredTool(
        name=tool.name,
        description=tool.description,
        args_schema=new_schema,
        coroutine=cast(Callable[..., Awaitable[Any]], wrapped),
    )
