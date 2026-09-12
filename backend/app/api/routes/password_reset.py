from fastapi import APIRouter, Depends, status
from fastapi_users.exceptions import UserNotExists
from pydantic import BaseModel, EmailStr, Field

from app.api.schemas.auth import UserUpdate
from app.database.users import UserManager, get_user_manager

router = APIRouter(prefix="/auth", tags=["Auth"])


class DirectPasswordResetRequest(BaseModel):
    email: EmailStr
    new_password: str = Field(min_length=8)


@router.post("/password-reset", status_code=status.HTTP_200_OK)
async def reset_password_directly(
    data: DirectPasswordResetRequest,
    user_manager: UserManager = Depends(get_user_manager),
):
    """
    TEMPORARY, INSECURE-BY-DESIGN: resets a password from email alone,
    no proof of ownership. Replace with an OTP-gated flow before this
    app has real users depending on account security.
    """
    generic_response = {"detail": "If that email exists, the password has been reset."}

    try:
        user = await user_manager.get_by_email(data.email)
    except UserNotExists:
        return generic_response  # same response either way — don't leak existence

    await user_manager.update(UserUpdate(password=data.new_password), user)
    return generic_response