from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.api.schemas.enums import DraftStatus


class DraftReplyResponse(BaseModel):
    id: str
    conversation_id: str
    trigger_message_id: str
    draft_content: str
    edited_content: str | None
    status: DraftStatus
    reviewed_by: UUID | None
    rejection_reason: str | None
    created_at: datetime
    reviewed_at: datetime | None
    sent_at: datetime | None

    class Config:
        from_attributes = True


class DraftApproveRequest(BaseModel):
    edited_content: str | None = None


class DraftRejectRequest(BaseModel):
    reason: str | None = None
    