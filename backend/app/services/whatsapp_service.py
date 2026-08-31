from sqlalchemy import select

from app.api.schemas.enums import AgentType
from app.database.models.draft_reply import DraftReply
from app.database.models.whatsapp_conversation import (
    MessageDirection,
    MessageType,
    WhatsAppConversation,
    WhatsAppMessage,
)


class WhatsAppService:
    """
    Owns both directions of the WhatsApp pipeline:
    inbound (webhook -> agent -> draft) and outbound (approved draft -> Meta).
    Draft creation/review lifecycle is owned by DraftService, injected per call.
    """

    def __init__(self, agent_service, whatsapp_client, transcription_client):
        self.agent_service = agent_service
        self.whatsapp_client = whatsapp_client
        self.transcription_client = transcription_client

    async def receive_message(
        self,
        customer_phone: str,
        content: str,
        session,
        memory_service,
        draft_service,
        message_type: MessageType = MessageType.TEXT,
        whatsapp_message_id: str | None = None,
        customer_name: str | None = None,
    ) -> DraftReply | None:

        if whatsapp_message_id:
            existing = await session.execute(
                select(WhatsAppMessage).where(
                    WhatsAppMessage.whatsapp_message_id == whatsapp_message_id
                )
            )
            if existing.scalar_one_or_none() is not None:
                return None  # already processed — Meta retried the same delivery
        
        conversation = await self._get_or_create_conversation(
            customer_phone, customer_name, session
        )

        # Fetch history BEFORE inserting the new message — otherwise it's duplicated
        # (once in history, once as the explicit query below).
        memory_context = await memory_service.prepare_context(conversation.id, session)

        inbound = WhatsAppMessage(
            conversation_id=conversation.id,
            direction=MessageDirection.INBOUND,
            message_type=message_type,
            content=content,
            whatsapp_message_id=whatsapp_message_id,
        )

        session.add(inbound)
        await session.flush()

        await memory_service.invalidate(conversation.id)  # new message written — cache is now stale


        # Consider shifting the ff block to DraftService Section
        agent_response = await self.agent_service.ask(
            agent=AgentType.WHATSAPP,
            query=content,
            context={
                "conversation_id": conversation.id,
                "history": memory_context["history"],
            },
        )

        draft = await draft_service.create_draft(
            conversation_id=conversation.id,
            trigger_message_id=inbound.id,
            draft_content=agent_response.answer,
            session=session,
        )

        # answer = result.answer
        # cost = result.cost

        # draft = DraftReply(
        #     conversation_id=conversation.id,
        #     trigger_message_id=inbound.id,
        #     draft_content=answer,
        # )
        # session.add(draft)

        await session.commit()
        await session.refresh(draft)

        return draft

    async def transcribe_voice_note(self, media_id: str) -> str:
        """
        Resolves a WhatsApp media ID to its actual transcript text.
        Kept here (not in receive_message) so the webhook layer decides
        *when* to call it, but never needs to know the two-step Graph API
        fetch mechanics itself.
        """
        media_url = await self.whatsapp_client.get_media_url(media_id)
        audio_bytes = await self.whatsapp_client.download_media(media_url)
        return await self.transcription_client.transcribe(audio_bytes)

    async def get_conversation_thread(self, conversation_id: str, session):
            conversation = await session.get(WhatsAppConversation, conversation_id)
            if conversation is None:
                return None
    
            result = await session.execute(
                select(WhatsAppMessage)
                .where(WhatsAppMessage.conversation_id == conversation_id)
                .order_by(WhatsAppMessage.created_at.asc())
            )
            messages = result.scalars().all()
    
            return conversation, messages

    async def send_approved_draft(self, draft: DraftReply, session) -> WhatsAppMessage:
        """
        Actually delivers an approved draft to the customer via Meta,
        then records it as a real outbound message.
        """
        conversation = await session.get(WhatsAppConversation, draft.conversation_id)
        content_to_send = draft.edited_content or draft.draft_content

        await self.whatsapp_client.send_text_message(
            to_phone=conversation.customer_phone,
            body=content_to_send,
        )

        outbound = WhatsAppMessage(
            conversation_id=conversation.id,
            direction=MessageDirection.OUTBOUND,
            content=content_to_send,
        )
        session.add(outbound)
        await session.flush()

        return outbound

    async def _get_or_create_conversation(self, customer_phone, customer_name, session):
        result = await session.execute(
            select(WhatsAppConversation).where(
                WhatsAppConversation.customer_phone == customer_phone
            )
        )
        conversation = result.scalar_one_or_none()

        if conversation is None:
            conversation = WhatsAppConversation(
                customer_phone=customer_phone,
                customer_name=customer_name,
            )
            session.add(conversation)
            await session.flush()

        return conversation

    