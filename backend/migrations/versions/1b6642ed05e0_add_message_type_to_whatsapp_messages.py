"""add message_type to whatsapp_messages

Revision ID: 1b6642ed05e0
Revises: f6f220b364e6
Create Date: 2026-08-04 06:32:47.465316

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "1b6642ed05e0"
down_revision: str | Sequence[str] | None = "f6f220b364e6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""

    message_type_enum = sa.Enum(
        "TEXT",
        "AUDIO",
        "IMAGE",
        name="messagetype",
    )

    message_type_enum.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "whatsapp_messages",
        sa.Column(
            "message_type",
            message_type_enum,
            nullable=False,
            server_default="TEXT",
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column("whatsapp_messages", "message_type")

    message_type_enum = sa.Enum(
        "TEXT",
        "AUDIO",
        "IMAGE",
        name="messagetype",
    )

    message_type_enum.drop(op.get_bind(), checkfirst=True)
