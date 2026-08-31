"""improve marketplace transaction lifecycle

Revision ID: 90b5eb3d6caa
Revises: 913857aeb387
Create Date: 2026-08-30

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = "90b5eb3d6caa"
down_revision: str | Sequence[str] | None = "913857aeb387"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


transaction_status_enum = postgresql.ENUM(
    "PENDING_PAYMENT",
    "PAID",
    "FAILED",
    "CANCELLED",
    "EXPIRED",
    name="transaction_status",
)

payment_required_from_enum = postgresql.ENUM(
    "BUYER",
    "SELLER",
    name="payment_required_from",
)


def upgrade() -> None:
    # Create PostgreSQL enum types first.
    transaction_status_enum.create(
        op.get_bind(),
        checkfirst=True,
    )

    payment_required_from_enum.create(
        op.get_bind(),
        checkfirst=True,
    )

    # New transaction participants / payment state.
    op.add_column(
        "transactions",
        sa.Column(
            "initiator_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
    )

    op.add_column(
        "transactions",
        sa.Column(
            "payment_required_from",
            payment_required_from_enum,
            nullable=False,
        ),
    )

    op.add_column(
        "transactions",
        sa.Column(
            "payer_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
    )

    op.add_column(
        "transactions",
        sa.Column(
            "status",
            transaction_status_enum,
            nullable=False,
        ),
    )

    op.add_column(
        "transactions",
        sa.Column(
            "payment_reference",
            sa.String(length=255),
            nullable=True,
        ),
    )

    op.add_column(
        "transactions",
        sa.Column(
            "paid_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    # Foreign keys.
    op.create_foreign_key(
        "fk_transactions_initiator_id_users",
        "transactions",
        "users",
        ["initiator_id"],
        ["id"],
    )

    op.create_foreign_key(
        "fk_transactions_payer_id_users",
        "transactions",
        "users",
        ["payer_id"],
        ["id"],
    )

    # Indexes.
    op.create_index(
        "ix_transactions_initiator_id",
        "transactions",
        ["initiator_id"],
    )

    op.create_index(
        "ix_transactions_payer_id",
        "transactions",
        ["payer_id"],
    )

    # A payment reference must identify one payment uniquely.
    op.create_unique_constraint(
        "uq_transactions_payment_reference",
        "transactions",
        ["payment_reference"],
    )

    # Remove the old payment representation.
    op.drop_column("transactions", "paid_by")
    op.drop_column("transactions", "fee_paid")


def downgrade() -> None:
    # Restore old payment columns.
    op.add_column(
        "transactions",
        sa.Column(
            "fee_paid",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    op.add_column(
        "transactions",
        sa.Column(
            "paid_by",
            sa.String(length=10),
            nullable=True,
        ),
    )

    # Remove constraints and indexes.
    op.drop_constraint(
        "uq_transactions_payment_reference",
        "transactions",
        type_="unique",
    )

    op.drop_index(
        "ix_transactions_payer_id",
        table_name="transactions",
    )

    op.drop_index(
        "ix_transactions_initiator_id",
        table_name="transactions",
    )

    op.drop_constraint(
        "fk_transactions_payer_id_users",
        "transactions",
        type_="foreignkey",
    )

    op.drop_constraint(
        "fk_transactions_initiator_id_users",
        "transactions",
        type_="foreignkey",
    )

    # Remove new columns.
    op.drop_column("transactions", "paid_at")
    op.drop_column("transactions", "payment_reference")
    op.drop_column("transactions", "status")
    op.drop_column("transactions", "payer_id")
    op.drop_column("transactions", "payment_required_from")
    op.drop_column("transactions", "initiator_id")

    # Remove PostgreSQL enum types.
    payment_required_from_enum.drop(
        op.get_bind(),
        checkfirst=True,
    )

    transaction_status_enum.drop(
        op.get_bind(),
        checkfirst=True,
    )