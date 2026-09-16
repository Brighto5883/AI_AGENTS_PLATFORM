"""add llm_usage_logs table

Revision ID: e04c1b5f972e
Revises: 26d685cd7d0b
Create Date: 2026-08-23 07:07:57.428270

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "e04c1b5f972e"
down_revision: str | Sequence[str] | None = "26d685cd7d0b"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create the LLM usage logs table."""

    op.create_table(
        "llm_usage_logs",
        sa.Column(
            "id",
            sa.UUID(),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.UUID(),
            nullable=True,
        ),
        sa.Column(
            "agent_name",
            sa.String(length=64),
            nullable=False,
        ),
        sa.Column(
            "conversation_id",
            sa.String(length=128),
            nullable=True,
        ),
        sa.Column(
            "model",
            sa.String(length=128),
            nullable=True,
        ),
        sa.Column(
            "prompt_tokens",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            "completion_tokens",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            "total_tokens",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            "cost",
            sa.Numeric(precision=12, scale=6),
            nullable=True,
        ),
        sa.Column(
            "duration_seconds",
            sa.Numeric(precision=8, scale=3),
            nullable=True,
        ),
        sa.Column(
            "status",
            sa.String(length=16),
            nullable=False,
        ),
        sa.Column(
            "error_message",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("llm_usage_logs_user_id_fkey"),
        ),
        sa.PrimaryKeyConstraint(
            "id",
            name=op.f("llm_usage_logs_pkey"),
        ),
    )

    op.create_index(
        op.f("ix_llm_usage_logs_user_id"),
        "llm_usage_logs",
        ["user_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_llm_usage_logs_agent_name"),
        "llm_usage_logs",
        ["agent_name"],
        unique=False,
    )

    op.create_index(
        op.f("ix_llm_usage_logs_conversation_id"),
        "llm_usage_logs",
        ["conversation_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_llm_usage_logs_status"),
        "llm_usage_logs",
        ["status"],
        unique=False,
    )

    op.create_index(
        op.f("ix_llm_usage_logs_created_at"),
        "llm_usage_logs",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    """Drop the LLM usage logs table."""

    op.drop_index(
        op.f("ix_llm_usage_logs_created_at"),
        table_name="llm_usage_logs",
    )

    op.drop_index(
        op.f("ix_llm_usage_logs_status"),
        table_name="llm_usage_logs",
    )

    op.drop_index(
        op.f("ix_llm_usage_logs_conversation_id"),
        table_name="llm_usage_logs",
    )

    op.drop_index(
        op.f("ix_llm_usage_logs_agent_name"),
        table_name="llm_usage_logs",
    )

    op.drop_index(
        op.f("ix_llm_usage_logs_user_id"),
        table_name="llm_usage_logs",
    )

    op.drop_table("llm_usage_logs")