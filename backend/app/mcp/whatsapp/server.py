# app/mcp/whatsapp/server.py

from mcp.server.fastmcp import FastMCP

from app.database.session import get_session_context
from app.mcp.whatsapp import prompts, resources, tools

whatsapp_mcp = FastMCP("whatsapp-assistant")


# --- Tools (data access only, no LLM calls) ---
@whatsapp_mcp.tool()
async def get_conversation_context(conversation_id: str) -> dict:
    """
    Fetch customer profile, recent message history, business FAQs,
    and writing style guidance for a given conversation. Use this
    before drafting a reply, summarizing, or suggesting a follow-up.
    """
    async with get_session_context() as db:
        return await tools.get_conversation_context(db, conversation_id)


# --- Resources ---
@whatsapp_mcp.resource("whatsapp://faqs")
def business_faqs() -> dict:
    return resources.get_business_faqs()


@whatsapp_mcp.resource("whatsapp://writing-style")
def writing_style() -> str:
    return resources.get_writing_style()


# --- Prompts ---
@whatsapp_mcp.prompt()
def friendly_assistant() -> str:
    return prompts.FRIENDLY_PROMPT


@whatsapp_mcp.prompt()
def professional_assistant() -> str:
    return prompts.PROFESSIONAL_PROMPT


@whatsapp_mcp.prompt()
def sales_assistant() -> str:
    return prompts.SALES_PROMPT

if __name__ == "__main__":
    whatsapp_mcp.run()
