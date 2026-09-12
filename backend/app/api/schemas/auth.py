import uuid

from fastapi_users import schemas
from pydantic import field_validator

from app.utils.phone import normalize_kenyan_phone_number


class UserRead(schemas.BaseUser[uuid.UUID]):
    name: str | None = None
    phone: str | None = None


class UserCreate(schemas.BaseUserCreate):
    phone: str | None = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        return normalize_kenyan_phone_number(v) if v else None


class UserUpdate(schemas.BaseUserUpdate):
    phone: str | None = None
    name: str | None = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        return normalize_kenyan_phone_number(v) if v else None
