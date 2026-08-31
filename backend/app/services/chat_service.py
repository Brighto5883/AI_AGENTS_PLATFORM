import logging

from fastapi import HTTPException, UploadFile

from app.api.schemas.enums import AgentType, RetrievalMethod
from app.database.models.query_history import QueryHistory
from app.knowledge.context import KnowledgeContext
from app.knowledge.scoped_knowledge import ScopedKnowledgeService

logger = logging.getLogger(__name__)


class ChatService:

    def __init__(self, agent_service):
        self.agent_service = agent_service
        self.scoped_knowledge = ScopedKnowledgeService()


    async def execute_query(
        self,
        query: str,
        user_id,
        session,
        method: RetrievalMethod = RetrievalMethod.AUTO,
        file: UploadFile | None = None,
    ):

        query = query.strip()

        if not query:
            raise HTTPException(
                status_code=400,
                detail="No question entered.",
            )

        knowledge = None
        scope = None

        try:
            if file is not None:
                try:
                    scope = await self.scoped_knowledge.create_scope(
                        file
                    )

                except Exception as e:
                    logger.exception("Error processing query")

                    raise HTTPException(
                        status_code=500,
                        detail="Error processing query.",
                    ) from e

                knowledge = KnowledgeContext(
                    scope_id = scope.scope_id,
                    uploaded_document_id=scope.document_id,
                )


            answer, documents, cost = await self.agent_service.ask(
                agent=AgentType.ROAD,
                query=query,
                knowledge=knowledge,
            )

        except HTTPException:
            raise

        except Exception as e:
            logger.exception("Error processing query")

            raise HTTPException(
                status_code=500,
                detail="Error processing query.",
            ) from e

        finally:
            if scope is not None:
                await self.scoped_knowledge.delete_scope(
                    scope.scope_id
                )


        query_record = QueryHistory(
            user_id=user_id,
            query=query,
            method=method,
            answer=answer,
            document=documents, 
            cost=cost,
        )


        session.add(query_record)

        try:
            await session.commit()
            await session.refresh(query_record)

        except Exception as e:
            await session.rollback()

            logger.exception("Failed to save query record")

            raise HTTPException(
                status_code=500,
                detail=f"Error saving query record: {e}",
            ) from e 

        return query_record