import hashlib
import hmac
import logging

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, Request

from app.api.dependencies.rate_limit import wait_for_rate_limit_slot
from app.config.settings import settings
from app.core.container import container
from app.database.models.whatsapp_conversation import MessageType
from app.database.session import get_session_context

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks/whatsapp", tags=["WhatsApp Webhook"])


def _verify_meta_signature(body: bytes, signature: str | None) -> bool:
    secret = settings.WHATSAPP_APP_SECRET
    if not secret:
        return settings.APP_ENV.lower() != "production"
    if not signature or not signature.startswith("sha256="):
        return False
    expected = hmac.new(
        secret.encode(),
        body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(signature[7:], expected)


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
        logger.warning("WhatsApp message dropped after rate-limit wait")
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
    raw_body = await request.body()
    signature = request.headers.get("X-Hub-Signature-256")
    if not _verify_meta_signature(raw_body, signature):
        raise HTTPException(status_code=403, detail="Invalid webhook signature.")

    payload = await request.json()

    try:
        entry = payload["entry"][0]["changes"][0]["value"]
        messages = entry.get("messages")

        if not messages:
            return {"status": "ignored"}

        message = messages[0]
        customer_phone = message["from"]
        whatsapp_message_id = message["id"]
        wa_type = message.get("type", "text")

        contacts = entry.get("contacts", [{}])
        customer_name = contacts[0].get("profile", {}).get("name")

        if wa_type == "text":
            content = message["text"]["body"]
            message_type = MessageType.TEXT

        elif wa_type == "audio":
            media_id = message["audio"]["id"]
            content = await container.whatsapp_service.transcribe_voice_note(media_id)
            message_type = MessageType.AUDIO

        else:
            return {"status": "ignored"}

    except (KeyError, IndexError, TypeError):
        return {"status": "ignored"}

    background_tasks.add_task(
        process_inbound_message,
        customer_phone=customer_phone,
        content=content,
        message_type=message_type,
        whatsapp_message_id=whatsapp_message_id,
        customer_name=customer_name,
    )

    return {"status": "received"}
