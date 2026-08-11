# app/database/models/__init__.py

from app.database.models.query_history import QueryHistory
from app.database.models.user import User
from app.database.models.whatsapp_conversation import WhatsAppConversation, WhatsAppMessage
from app.database.models.draft_reply import DraftReply

# Importing them here means "import app.database.models" (even unused)
# is enough to register every table on Base.metadata.