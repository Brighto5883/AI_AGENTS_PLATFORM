from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.schemas.drafts import (
    DraftApproveRequest,
    DraftRejectRequest,
    DraftReplyResponse,
)
from app.api.schemas.enums import DraftStatus
from app.api.schemas.whatsapp import ConversationThreadResponse
from app.core.container import container
from app.database.models.user import User
from app.database.session import get_async_session
from app.database.users import current_active_user

router = APIRouter(prefix="/drafts", tags=["Drafts"])


@router.get("/", response_model=list[DraftReplyResponse])
async def list_drafts(
    status: DraftStatus | None = Query(default=None),
    authenticated_user: User = Depends(current_active_user),
    session=Depends(get_async_session),
):
    return await container.draft_service.list_drafts(session=session, status=status)


@router.get("/{draft_id}", response_model=DraftReplyResponse)
async def get_draft(
    draft_id: str,
    authenticated_user: User = Depends(current_active_user),
    session=Depends(get_async_session),
):
    return await container.draft_service.get_draft(draft_id=draft_id, session=session)


@router.post("/{draft_id}/approve", response_model=DraftReplyResponse)
async def approve_draft(
    draft_id: str,
    request: DraftApproveRequest,
    authenticated_user: User = Depends(current_active_user),
    session=Depends(get_async_session),
):
    return await container.draft_service.approve(
        draft_id=draft_id,
        reviewer_id=authenticated_user.id,
        edited_content=request.edited_content,
        session=session,
    )


@router.post("/{draft_id}/reject", response_model=DraftReplyResponse)
async def reject_draft(
    draft_id: str,
    request: DraftRejectRequest,
    authenticated_user: User = Depends(current_active_user),
    session=Depends(get_async_session),
):
    return await container.draft_service.reject(
        draft_id=draft_id,
        reviewer_id=authenticated_user.id,
        reason=request.reason,
        session=session,
    )


@router.post("/{draft_id}/send", response_model=DraftReplyResponse)
async def send_draft(
    draft_id: str,
    authenticated_user: User = Depends(current_active_user),
    session=Depends(get_async_session),
):
    return await container.draft_service.send(draft_id=draft_id, session=session)

@router.get("/{draft_id}/thread", response_model=ConversationThreadResponse)
async def get_draft_thread(
    draft_id: str,
    authenticated_user: User = Depends(current_active_user),
    session=Depends(get_async_session),
):
    draft = await container.draft_service.get_draft(draft_id=draft_id, session=session)

    result = await container.whatsapp_service.get_conversation_thread(
        conversation_id=draft.conversation_id, session=session
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conversation, messages = result

    return ConversationThreadResponse(
        conversation_id=conversation.id,
        customer_phone=conversation.customer_phone,
        customer_name=conversation.customer_name,
        messages=messages,
    )