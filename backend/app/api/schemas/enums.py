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
    PENDING = "pending"    # agent produced it, no human has looked yet
    APPROVED = "approved"  # human approved as-is
    EDITED = "edited"      # human changed the content, then approved
    REJECTED = "rejected"  # human declined to send it
    SENT = "sent"          # actually delivered (Phase E hooks in here)

class FeedbackCategory(StrEnum):
    BUG = "bug"
    PAYMENT = "payment"
    MARKETPLACE = "marketplace"
    ACCOUNT = "account"
    SUGGESTION = "suggestion"
    GENERAL = "general"