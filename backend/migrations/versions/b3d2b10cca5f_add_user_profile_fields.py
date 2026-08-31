"""add user profile fields

Revision ID: b3d2b10cca5f
Revises: e04c1b5f972e
Create Date: 2026-08-29 16:51:48.047258

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b3d2b10cca5f"
down_revision: Union[str, Sequence[str], None] = "e04c1b5f972e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("name", sa.String(length=120), nullable=True),
    )

    op.add_column(
        "users",
        sa.Column("phone", sa.String(length=20), nullable=True),
    )

    op.add_column(
        "users",
        sa.Column(
            "role",
            sa.String(length=20),
            nullable=False,
            server_default="both",
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
    )

    op.create_index(
        op.f("ix_users_phone"),
        "users",
        ["phone"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_users_phone"),
        table_name="users",
    )

    op.drop_column("users", "created_at")
    op.drop_column("users", "phone")
    op.drop_column("users", "name")
    op.drop_column("users", "role")
