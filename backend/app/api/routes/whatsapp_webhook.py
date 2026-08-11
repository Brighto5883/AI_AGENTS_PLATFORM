from app.api.dependencies.rate_limit import wait_for_rate_limit_slot
from app.config.settings import settings
from app.core.container import container
from app.database.models.whatsapp_conversation import MessageType
from app.database.session import get_session_context
from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, Request

router = APIRouter(prefix="/webhooks/whatsapp", tags=["WhatsApp Webhook"])


@router.get("/")
async def verify_webhook(
    hub_mode: str = Query(alias="hub.mode"),
    hub_challenge: str = Query(alias="hub.challenge"),
    hub_verify_token: str = Query(alias="hub.verify_token"),
):
    if hub_mode == "subscribe" and hub_verify_token == settings.WHATSAPP_WEBHOOK_VERIFY_TOKEN:
        return int(hub_challenge)
    raise HTTPException(status_code=403, detail="Verification failed")


async def process_inbound_message(
    customer_phone: str,
    content: str,
    message_type: MessageType,
    whatsapp_message_id: str,
    customer_name: str | None,
):
    """
    Runs after the webhook response has already been sent to Meta.
    Owns its own DB session since the request-scoped one is gone by now.
    """

    try:
        await wait_for_rate_limit_slot(customer_phone)
    except ValueError:
        # genuinely abusive/stuck sender — log it, don't process, don't crash
        print(f"[rate limit] dropped message from {customer_phone} after max wait")
        return

    async with get_session_context() as session:
        await container.whatsapp_service.receive_message(
            customer_phone=customer_phone,
            content=content,
            message_type=message_type,
            whatsapp_message_id=whatsapp_message_id,
            session=session,
            customer_name=customer_name,
            draft_service=container.draft_service,
            memory_service = container.memory_service,
        )


@router.post("/")
async def receive_webhook(request: Request, background_tasks: BackgroundTasks):
    payload = await request.json()

    try:
        entry = payload["entry"][0]["changes"][0]["value"]
        messages = entry.get("messages")

        if not messages:
            return {"status": "ignored"}

        message = messages[0]
        customer_phone = message["from"]
        content = message["text"]["body"]
        whatsapp_message_id = message["id"]
        wa_type = message.get("type", "text")

        contacts = entry.get("contacts", [{}])
        customer_name = contacts[0].get("profile", {}).get("name")

    except (KeyError, IndexError):
        return {"status": "ignored"}

    if wa_type == "text":
        content = message["text"]["body"]
        message_type = MessageType.TEXT

    elif wa_type == "audio":
        media_id = message["audio"]["id"]
        # If transcription is slow, it can be pushed into the background task too
        content = await container.whatsapp_service.transcribe_voice_note(media_id)
        message_type = MessageType.AUDIO

    else:
        return {"status": "ignored"}  # images: next slice of Phase G

    background_tasks.add_task(
        process_inbound_message,
        customer_phone=customer_phone,
        content=content,
        message_type=message_type,
        whatsapp_message_id=whatsapp_message_id,
        customer_name=customer_name,
    )

    return {"status": "received"}
