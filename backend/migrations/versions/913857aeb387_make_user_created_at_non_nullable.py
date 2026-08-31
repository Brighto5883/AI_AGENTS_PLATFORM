"""make user created_at non nullable

Revision ID: 913857aeb387
Revises: 5f9a7c4daf7e
Create Date: 2026-08-29 17:44:03.110306

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '913857aeb387'
down_revision: Union[str, Sequence[str], None] = '5f9a7c4daf7e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE users
        SET created_at = NOW()
        WHERE created_at IS NULL
        """
    )

    op.alter_column(
        "users",
        "created_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "users",
        "created_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        nullable=True,
    )
