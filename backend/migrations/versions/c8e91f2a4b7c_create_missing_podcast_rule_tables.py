"""create missing podcast rule tables

Revision ID: c8e91f2a4b7c
Revises: 7f1a2c3d4e5f
"""

from alembic import op


revision = "c8e91f2a4b7c"
down_revision = "7f1a2c3d4e5f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS public.podcast_rule_sets (
            id VARCHAR NOT NULL,
            user_id UUID NOT NULL,
            name VARCHAR NOT NULL,
            is_active BOOLEAN NOT NULL,
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            CONSTRAINT podcast_rule_sets_pkey PRIMARY KEY (id),
            CONSTRAINT podcast_rule_sets_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES public.users(id)
        )
    """)

    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_podcast_rule_sets_user_id
        ON public.podcast_rule_sets (user_id)
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS public.podcast_rules (
            id VARCHAR NOT NULL,
            rule_set_id VARCHAR NOT NULL,
            name VARCHAR NOT NULL,
            description TEXT NOT NULL,
            weight INTEGER NOT NULL,
            CONSTRAINT podcast_rules_pkey PRIMARY KEY (id),
            CONSTRAINT podcast_rules_rule_set_id_fkey
                FOREIGN KEY (rule_set_id)
                REFERENCES public.podcast_rule_sets(id)
        )
    """)

    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_podcast_rules_rule_set_id
        ON public.podcast_rules (rule_set_id)
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS public.podcast_rules")
    op.execute("DROP TABLE IF EXISTS public.podcast_rule_sets")
