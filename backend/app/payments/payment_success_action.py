from abc import ABC, abstractmethod

from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models.payment import Payment


class PaymentSuccessAction(ABC):
    @abstractmethod
    def supports(self, payment: Payment) -> bool:
        """Return True when this action owns the payment."""
        raise NotImplementedError

    @abstractmethod
    async def execute(
        self,
        *,
        payment: Payment,
        session: AsyncSession,
    ) -> None:
        """Execute the business consequence of a successful payment."""
        raise NotImplementedError