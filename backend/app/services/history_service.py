from sqlalchemy import select

from app.database.models.query_history import QueryHistory


class HistoryService:

    async def get_history(
        self,
        user_id,
        session,
    ):

        result = await session.execute(
            select(QueryHistory).where(
                QueryHistory.user_id == user_id
            )
        )

        return result.scalars().all()



    async def delete_history(
        self,
        query_id,
        session,
    ):

        result = await session.execute(
            select(QueryHistory).where(
                QueryHistory.id == query_id
            )
        )

        query_history = result.scalars().first()

        if query_history:

            await session.delete(query_history)
            await session.commit()

        return query_history