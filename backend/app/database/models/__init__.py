# app/database/models/__init__.py
from app.database.models.draft_reply import DraftReply
from app.database.models.feedback import Feedback
from app.database.models.listing import Listing
from app.database.models.listing_image import ListingImage
from app.database.models.payment import Payment
from app.database.models.podcast_ruleset import PodcastRule, PodcastRuleSet
from app.database.models.query_history import QueryHistory
from app.database.models.transaction import Transaction
from app.database.models.user import User
from app.database.models.wanted_post import WantedPost
from app.database.models.whatsapp_conversation import (
    WhatsAppConversation,
    WhatsAppMessage,
)

from .llm_usage_log import LLMUsageLog

__all__ = [
    "DraftReply",
    "QueryHistory",
    "User",
    "WhatsAppConversation",
    "WhatsAppMessage",
    "LLMUsageLog",
    "PodcastRuleSet",
    "PodcastRule",
    'Listing',
    'Transaction',
    'WantedPost',
    'Payment',
    'ListingImage',
    'Feedback',
]

# Importing them here means "import app.database.models" (even unused)
# is enough to register every table on Base.metadata.
