from fastapi import HTTPException
from app.api.schemas.enums import AgentType, RetrievalMethod
from app.database.models.query_history import QueryHistory


class ChatService:

    def __init__(self, agent_service):
        self.agent_service = agent_service


    async def execute_query(
        self,
        query: str,
        user_id,
        session,
        method: RetrievalMethod = RetrievalMethod.AUTO,
    ):

        query = query.strip()

        if not query:
            raise HTTPException(
                status_code=400,
                detail="No question entered.",
            )

        try:
            answer, documents, cost = await self.agent_service.ask(
                agent=AgentType.ROAD,
                query=query,
            )

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error processing query: {e}",
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

            raise HTTPException(
                status_code=500,
                detail=f"Error saving query record: {e}",
            )

        return query_record