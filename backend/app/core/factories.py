from app.agents.email_agent import EmailAssistant
from app.agents.road_design_agent import RoadDesignAgent
from app.agents.whatsapp_agent import WhatsAppAssistant
from app.integrations.whatsapp.client import WhatsAppClient
from app.integrations.whatsapp.transcription import TranscriptionClient
from app.marketplace.services.listing_service import ListingService
from app.marketplace.services.transaction_service import TransactionService
from app.marketplace.services.wanted_post_service import WantedPostService
from app.memory.service import MemoryService
from app.routing.agent_router import AgentRouter
from app.services.agent_service import AgentService
from app.services.chat_service import ChatService
from app.services.draft_service import DraftService
from app.services.history_service import HistoryService
from app.services.whatsapp_service import WhatsAppService


def create_road_design_agent():

    return RoadDesignAgent()

def create_whatsapp_agent():
    return WhatsAppAssistant()

def create_email_agent():
    return EmailAssistant()

def create_whatsapp_client():
    return WhatsAppClient()

def create_agent_service(router):

    return AgentService(router)

def create_agent_router(
    road_agent,
    whatsapp_agent,
    email_agent,
):
    return AgentRouter(
        road_agent=road_agent,
        whatsapp_agent=whatsapp_agent,
        email_agent=email_agent,
    )


def create_chat_service(agent_service):

    return ChatService(
        agent_service
    )


def create_history_service():

    return HistoryService()


def create_whatsapp_service(agent_service, whatsapp_client, transcription_client):
    return WhatsAppService(
        agent_service=agent_service,
        whatsapp_client=whatsapp_client,
        transcription_client=transcription_client
    )

def create_draft_service(whatsapp_service):
    return DraftService(
        whatsapp_service=whatsapp_service
    )

def create_transcription_client():
    return TranscriptionClient()

def create_memory_service():
    return MemoryService()

def create_listing_service():
    return ListingService()


def create_wanted_post_service():
    return WantedPostService()


def create_transaction_service():
    return TransactionService()
