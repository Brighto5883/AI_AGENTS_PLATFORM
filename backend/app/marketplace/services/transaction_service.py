from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models.listing import Listing
from app.database.models.transaction import Transaction
from app.marketplace.enums import PaymentRequiredFrom, TransactionStatus
from app.marketplace.pricing.connection_fee import get_connection_fee


class TransactionService:

    async def create_connection(
        self,
        listing: Listing,
        initiator_id: UUID,
        request_other_party_to_pay: bool,
        session: AsyncSession,
    ) -> Transaction:

        if listing.seller_id == initiator_id:
            raise HTTPException(
                status_code=400,
                detail="You cannot connect with your own listing.",
            )

        if not listing.is_approved:
            raise HTTPException(
                status_code=400,
                detail="This listing is not available.",
            )

        buyer_id = initiator_id
        seller_id = listing.seller_id

        if request_other_party_to_pay:
            payment_required_from = PaymentRequiredFrom.SELLER
        else:
            payment_required_from = PaymentRequiredFrom.BUYER

        transaction = Transaction(
            listing_id=listing.id,
            buyer_id=buyer_id,
            seller_id=seller_id,
            initiator_id=initiator_id,
            fee_amount=get_connection_fee(listing.category),
            payment_required_from=payment_required_from,
            payer_id=None,
            status=TransactionStatus.PENDING_PAYMENT,
        )

        session.add(transaction)

        await session.commit()
        await session.refresh(transaction)

        return transaction

    async def decline_payment_request(
        self,
        transaction: Transaction,
        user_id: UUID,
        session: AsyncSession,
    ) -> Transaction:

        if transaction.status != TransactionStatus.PENDING_PAYMENT:
            raise HTTPException(
                status_code=400,
                detail="This transaction is no longer awaiting payment.",
            )

        if transaction.payment_required_from == PaymentRequiredFrom.BUYER:
            expected_payer_id = transaction.buyer_id
        else:
            expected_payer_id = transaction.seller_id

        if user_id != expected_payer_id:
            raise HTTPException(
                status_code=403,
                detail="You are not the party currently requested to pay.",
            )

        if transaction.initiator_id == transaction.buyer_id:
            transaction.payment_required_from = PaymentRequiredFrom.BUYER
        else:
            transaction.payment_required_from = PaymentRequiredFrom.SELLER

        await session.commit()
        await session.refresh(transaction)

        return transaction

    async def record_payment(
        self,
        transaction: Transaction,
        payer_id: UUID,
        payment_reference: str,
        session: AsyncSession,
    ) -> Transaction:

        if transaction.status != TransactionStatus.PENDING_PAYMENT:
            raise HTTPException(
                status_code=400,
                detail="This transaction is not awaiting payment.",
            )

        if payer_id not in (
            transaction.buyer_id,
            transaction.seller_id,
        ):
            raise HTTPException(
                status_code=403,
                detail="You are not a participant in this transaction.",
            )

        if (
            transaction.payment_required_from == PaymentRequiredFrom.BUYER
            and payer_id != transaction.buyer_id
        ):
            raise HTTPException(
                status_code=403,
                detail="The buyer is currently required to pay.",
            )

        if (
            transaction.payment_required_from == PaymentRequiredFrom.SELLER
            and payer_id != transaction.seller_id
        ):
            raise HTTPException(
                status_code=403,
                detail="The seller is currently required to pay.",
            )

        transaction.payer_id = payer_id
        transaction.payment_reference = payment_reference
        transaction.paid_at = datetime.now(UTC)
        transaction.status = TransactionStatus.PAID

        await session.commit()
        await session.refresh(transaction)

        return transaction

    async def request_other_party_to_pay(
        self,
        transaction: Transaction,
        user_id: UUID,
        session: AsyncSession,
    ) -> Transaction:

        if transaction.status != TransactionStatus.PENDING_PAYMENT:
            raise HTTPException(
                status_code=400,
                detail="This transaction is no longer awaiting payment.",
            )

        if transaction.initiator_id != user_id:
            raise HTTPException(
                status_code=403,
                detail="Only the transaction initiator can request the other party to pay.",
            )

        if transaction.initiator_id == transaction.buyer_id:
            transaction.payment_required_from = PaymentRequiredFrom.SELLER
        else:
            transaction.payment_required_from = PaymentRequiredFrom.BUYER

        await session.commit()
        await session.refresh(transaction)

        return transaction