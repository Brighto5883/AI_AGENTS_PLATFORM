from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models.listing import Listing
from app.database.models.payment import Payment
from app.database.models.transaction import Transaction
from app.marketplace.enums import TransactionStatus
from app.payments.payment_success_action import PaymentSuccessAction


class MarketplacePaymentSuccessHandler(PaymentSuccessAction):

    LISTING_FEE_PURPOSE = "marketplace_listing_fee"
    CONNECTION_FEE_PURPOSE = "marketplace_connection_fee"

    def supports(self, payment: Payment) -> bool:
        return payment.purpose in {
            self.LISTING_FEE_PURPOSE,
            self.CONNECTION_FEE_PURPOSE,
        }

    async def execute(
        self,
        *,
        payment: Payment,
        session: AsyncSession,
    ) -> None:

        if payment.purpose == self.LISTING_FEE_PURPOSE:
            await self._complete_listing_payment(
                payment=payment,
                session=session,
            )
            return

        if payment.purpose == self.CONNECTION_FEE_PURPOSE:
            await self._complete_connection_payment(
                payment=payment,
                session=session,
            )
            return

        raise ValueError(
            f"Unsupported marketplace payment purpose: "
            f"{payment.purpose}"
        )

    async def _complete_listing_payment(
        self,
        *,
        payment: Payment,
        session: AsyncSession,
    ) -> None:
        if payment.reference_type != "listing":
            raise ValueError(
                "Marketplace listing payment must reference a listing."
            )

        # Listing-specific business action will be implemented here.
        # payment.reference_id identifies the Listing.
        # The listing should transition from its
        # payment-required state into its active/published state.
        listing = await session.get(
            Listing,
            payment.reference_id,
        )

        if listing is None:
            raise ValueError(
                f"Listing {payment.reference_id} does not exist."
            )

        if listing.is_approved:
            return
        
        listing.is_approved = True
        listing.needs_review = False

        await session.flush()

    async def _complete_connection_payment(
        self,
        *,
        payment: Payment,
        session: AsyncSession,
    ) -> None:
        if payment.reference_type != "transaction":
            raise ValueError(
                "Marketplace connection payment must reference a transaction."
            )

        # Transaction-specific business action will be implemented here.
        #
        # payment.reference_id identifies the Transaction.
        #
        # The transaction should transition from its
        # payment-required state into its next business state.

        transaction = await session.get(
            Transaction,
            payment.reference_id,
        )

        if transaction is None:
            raise ValueError(
                f"Transaction {payment.reference_id} "
                "does not exist."
            )

        if transaction.status == TransactionStatus.PAID:
            return

        if transaction.status != TransactionStatus.PENDING_PAYMENT:
            raise ValueError(
                "Transaction is not awaiting payment."
            )

        if transaction.payer_id is not None and transaction.payer_id != payment.payer_id:
            raise ValueError(
                "Payment payer does not match transaction payer."
            )

        transaction.payer_id = payment.payer_id
        transaction.status = TransactionStatus.PAID

        await session.flush()