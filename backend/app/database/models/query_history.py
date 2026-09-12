import uuid

from sqlalchemy import Column, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


class QueryHistory(Base):

    __tablename__ = "query_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4) 
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False) 
    query = Column(Text, nullable=False) 
    method = Column(String, nullable=False) 
    answer = Column(Text, nullable=False) 
    document = Column(String, nullable=False) 
    cost = Column(Float, nullable=False)

    user = relationship(
        "User",
        back_populates="queries"
    )