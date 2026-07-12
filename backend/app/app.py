from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.users import fastapi_users, auth_backend, current_active_user
from requests import session
from app.schemas import QueryHistoryDelete, QueryRequest, QueryResponse, QueryHistoryResponse, UserRead, UserCreate, UserUpdate
from app.db import create_db_and_tables, get_async_session, QueryHistory, User
from  contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.search import RAGSearch
from src.vectorlessRAG import vectorless_rag, get_pageindex_tree
import litellm
from litellm.caching import Cache
import uuid

litellm.cache = Cache(
    type="redis",
    host="localhost",
    port=6379
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_db_and_tables()
    yield

api = FastAPI(lifespan=lifespan)

api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],

)

api.include_router(fastapi_users.get_auth_router(auth_backend), prefix='/auth/jwt', tags=["auth"])
api.include_router(fastapi_users.get_register_router(UserRead, UserCreate), prefix="/auth", tags=["auth"])
api.include_router(fastapi_users.get_reset_password_router(), prefix="/auth", tags=["auth"])
api.include_router(fastapi_users.get_verify_router(UserRead), prefix="/auth", tags=["auth"])
api.include_router(fastapi_users.get_users_router(UserRead, UserUpdate), prefix="/users", tags=["users"])

# ======================================================================
@api.get('/')
def welcome():
    return {
        'message': 'WELCOME TO ROAD DESIGN AGENT'
    }

#=======================================================================
@api.post("/query", response_model=QueryResponse)
async def execute_query(
    request: QueryRequest,
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    query = request.query.strip()
    method = request.method.lower()  # Normalize method to lowercase for consistency

    if not query:
        raise HTTPException(status_code=400, detail="No question entered.")

    try:
        if method == "hybrid": 
            rag_search = RAGSearch()
            answer, documents, cost = rag_search.search_and_summarize(query=query, top_k=2)
        
        elif method == "vectorless":
                tree = get_pageindex_tree()
                answer, documents, cost = vectorless_rag(query=query, tree=tree)
                # I need to modify Vectorless to return answer, document and cost

        else:
            raise HTTPException(status_code=400, detail="Invalid method. Please enter 'hybrid' or 'vectorless'.")
    
    except HTTPException:
        # Re-raise HTTPExceptions unchanged
        raise

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")
    
    #Create a database record for the query
    query_record = QueryHistory(
        user_id=authenticated_user.id,
        query=query,
        method=method,
        answer=answer,
        document=documents,
        cost=cost,
    )
    try:
        session.add(query_record)
        await session.commit()
        await session.refresh(query_record)
        
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Error occurred while saving query record: {str(e)}")

    return query_record

#=======================================================================
@api.get("/feed", response_model=list[QueryHistoryResponse])
async def get_query_feed(
    authenticated_user: User = Depends(current_active_user), 
    session: AsyncSession = Depends(get_async_session)
    ):

    result = await session.execute(select(QueryHistory).where(QueryHistory.user_id == authenticated_user.id))

    return result.scalars().all()

#=======================================================================
@api.delete('/feed/{query_id}', response_model=QueryHistoryDelete)
async def delete_query_history(
    query_id: str,
    authenticated_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session)
    ):
    try:
        query_uuid = uuid.UUID(query_id)

        result = await session.execute(select(QueryHistory).where(QueryHistory.id == query_uuid))
        query_history = result.scalars().first()

        if not query_history:
            raise HTTPException(status_code=404, detail="Query history not found")

        if query_history.user_id != authenticated_user.id:
            raise HTTPException(status_code = 403, detail="You don't have permission to delete this query")
        await session.delete(query_history)
        await session.commit()

        return {"success": True, "message": "Query history deleted successfully"}
    
    except HTTPException:
        raise

    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=str(e))