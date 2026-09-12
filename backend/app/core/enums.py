from enum import StrEnum


class AgentType(StrEnum):
    ROAD = "road"
    WHATSAPP = "whatsapp"
    EMAIL = "email"


class RetrievalMethod(StrEnum):
    AUTO = "auto"
    HYBRID = "hybrid"
    VECTORLESS = "vectorless"


class DraftStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    EDITED = "edited"
    REJECTED = "rejected"
    SENT = "sent"


class FeedbackCategory(StrEnum):
    BUG = "bug"
    PAYMENT = "payment"
    MARKETPLACE = "marketplace"
    ACCOUNT = "account"
    SUGGESTION = "suggestion"
    GENERAL = "general"
