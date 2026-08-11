from sqlalchemy.orm import relationship
from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from app.database.db import Base


class User(SQLAlchemyBaseUserTableUUID, Base):

    __tablename__ = "users"

    queries = relationship(
        "QueryHistory",
        back_populates="user"
    )