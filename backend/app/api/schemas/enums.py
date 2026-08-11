from enum import Enum


class AgentType(str, Enum):
    ROAD = "road"
    WHATSAPP = "whatsapp"
    EMAIL = "email"


class RetrievalMethod(str, Enum):
    AUTO = "auto"
    HYBRID = "hybrid"
    VECTORLESS = "vectorless"

class DraftStatus(str, Enum):
    PENDING = "pending"    # agent produced it, no human has looked yet
    APPROVED = "approved"  # human approved as-is
    EDITED = "edited"      # human changed the content, then approved
    REJECTED = "rejected"  # human declined to send it
    SENT = "sent"          # actually delivered (Phase E hooks in here)