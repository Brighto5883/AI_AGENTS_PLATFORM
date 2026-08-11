from fastapi import APIRouter

router = APIRouter(
    prefix="/health",
    tags=["Health"],
)


@router.get("/")
async def welcome():
    return {
        "message": "WELCOME TO ROAD DESIGN AGENT"
    }