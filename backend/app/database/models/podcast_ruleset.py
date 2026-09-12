import uuid
from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class PodcastRuleSet(Base):
    """
    A named collection of comment-classification rules, owned by a
    platform user. Each user can define their own rubric for what
    'top comment' means to them — there is no single hardcoded
    definition, since this is inherently subjective per creator.
    """
    __tablename__ = "podcast_rule_sets"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String)  # e.g. "My channel's engagement rubric"
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))

    rules: Mapped[list["PodcastRule"]] = relationship(
        back_populates="rule_set", order_by="PodcastRule.weight.desc()"
    )


class PodcastRule(Base):
    """
    A single classification criterion within a rule set.
    e.g. name="Substantive question", weight=8,
         description="Comment asks a specific, on-topic question about
         something discussed in the episode, not a generic greeting."
    """
    __tablename__ = "podcast_rules"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    rule_set_id: Mapped[str] = mapped_column(ForeignKey("podcast_rule_sets.id"), index=True)
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(Text)
    weight: Mapped[int] = mapped_column(Integer, default=5)  # 1-10, relative importance

    rule_set: Mapped["PodcastRuleSet"] = relationship(back_populates="rules")