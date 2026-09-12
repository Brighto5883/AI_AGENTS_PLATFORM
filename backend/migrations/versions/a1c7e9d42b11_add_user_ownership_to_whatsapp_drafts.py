"""add user ownership to WhatsApp conversations and drafts

Revision ID: a1c7e9d42b11
Revises: 9f3f0148f832
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = "a1c7e9d42b11"
down_revision: str | Sequence[str] | None = "9f3f0148f832"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "whatsapp_conversations",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index(
        "ix_whatsapp_conversations_user_id",
        "whatsapp_conversations",
        ["user_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_whatsapp_conversations_user_id_users",
        "whatsapp_conversations",
        "users",
        ["user_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.add_column(
        "draft_replies",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index(
        "ix_draft_replies_user_id",
        "draft_replies",
        ["user_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_draft_replies_user_id_users",
        "draft_replies",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # Existing conversations that can be matched to a registered platform
    # user are associated with that user. Drafts inherit that ownership.
    op.execute(
        sa.text(
            """
            UPDATE whatsapp_conversations AS c
            SET user_id = u.id
            FROM users AS u
            WHERE c.user_id IS NULL
              AND u.phone = c.customer_phone
            """
        )
    )
    op.execute(
        sa.text(
            """
            UPDATE draft_replies AS d
            SET user_id = c.user_id
            FROM whatsapp_conversations AS c
            WHERE d.user_id IS NULL
              AND d.conversation_id = c.id
              AND c.user_id IS NOT NULL
            """
        )
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_draft_replies_user_id_users",
        "draft_replies",
        type_="foreignkey",
    )
    op.drop_index("ix_draft_replies_user_id", table_name="draft_replies")
    op.drop_column("draft_replies", "user_id")

    op.drop_constraint(
        "fk_whatsapp_conversations_user_id_users",
        "whatsapp_conversations",
        type_="foreignkey",
    )
    op.drop_index(
        "ix_whatsapp_conversations_user_id",
        table_name="whatsapp_conversations",
    )
    op.drop_column("whatsapp_conversations", "user_id")
