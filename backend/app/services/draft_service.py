from uuid import UUID
from datetime import UTC, datetime

from fastapi import HTTPException
from sqlalchemy import select

from app.api.schemas.enums import DraftStatus
from app.database.models.draft_reply import DraftReply


class DraftService:

    def __init__(self, whatsapp_service):
        self.whatsapp_service = whatsapp_service

    async def create_draft(
        self,
        conversation_id: str,
        trigger_message_id: str,
        draft_content: str,
        session,
    ) -> DraftReply:
        draft = DraftReply(
            conversation_id=conversation_id,
            trigger_message_id=trigger_message_id,
            draft_content=draft_content,
        )
        
        session.add(draft)
        await session.flush()
        return draft

    async def list_drafts(self, session, status: DraftStatus | None = None):
        query = select(DraftReply).order_by(DraftReply.created_at.desc())
        if status:
            query = query.where(DraftReply.status == status)
        result = await session.execute(query)
        return result.scalars().all()

    async def get_draft(self, draft_id: str, session) -> DraftReply:
        draft = await session.get(DraftReply, draft_id)
        if draft is None:
            raise HTTPException(status_code=404, detail="Draft not found")
        return draft

    async def approve(
        self, 
        draft_id: str, 
        reviewer_id: UUID, 
        session, 
        edited_content: str | None = None
    ) -> DraftReply:
        draft = await self.get_draft(draft_id, session)
        self._ensure_pending(draft)

        if edited_content:
            draft.edited_content = edited_content
            draft.status = DraftStatus.EDITED
        else:
            draft.status = DraftStatus.APPROVED

        draft.reviewed_by = reviewer_id
        draft.reviewed_at = datetime.now(UTC)

        await session.commit()
        await session.refresh(draft)
        return draft

    async def reject(
        self, 
        draft_id: str, 
        reviewer_id: UUID, 
        session, 
        reason: str | None = None
    ) -> DraftReply:
        draft = await self.get_draft(draft_id, session)
        self._ensure_pending(draft)

        draft.status = DraftStatus.REJECTED
        draft.rejection_reason = reason
        draft.reviewed_by = reviewer_id
        draft.reviewed_at = datetime.now(UTC)

        await session.commit()
        await session.refresh(draft)
        return draft

    async def send(self, draft_id: str, session) -> DraftReply:
        draft = await self.get_draft(draft_id, session)

        if draft.status not in (DraftStatus.APPROVED, DraftStatus.EDITED):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot send a draft with status '{draft.status.value}' — it must be approved first.",
            )

        await self.whatsapp_service.send_approved_draft(draft, session)

        draft.status = DraftStatus.SENT
        draft.sent_at = datetime.now(UTC)

        await session.commit()
        await session.refresh(draft)
        return draft

    def _ensure_pending(self, draft: DraftReply):
        if draft.status != DraftStatus.PENDING:
            raise HTTPException(
                status_code=400,
                detail=f"Draft already reviewed (status: '{draft.status.value}')",
            )