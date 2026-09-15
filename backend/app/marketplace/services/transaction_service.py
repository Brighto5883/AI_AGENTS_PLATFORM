from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.billing.billing_service import BillingService
from app.database.models.listing import Listing
from app.database.models.transaction import Transaction
from app.database.models.user import User
from app.database.models.wanted_post import WantedPost
from app.marketplace.enums import PaymentRequiredFrom, TransactionStatus


class TransactionService:

    def __init__(self, billing_service: BillingService) -> None:
        self.billing_service = billing_service


    async def create_listing_connection(
        self,
        listing: Listing,
        initiator_id: UUID,
        session: AsyncSession,
    ) -> Transaction:

        if listing.seller_id == initiator_id:
            raise HTTPException(
                status_code=400,
                detail="You cannot connect with your own listing.",
            )

        if not listing.is_approved or not listing.is_active:
            raise HTTPException(
                status_code=400,
                detail="This listing is not available.",
            )

        buyer_id = initiator_id
        seller_id = listing.seller_id

        user = await session.get(User, initiator_id)
        if user is None:
            raise HTTPException(status_code=404, detail="User not found.")
        capabilities = self.billing_service.get_capabilities(user)
        fee_amount = (
            self.billing_service.get_connection_fee()
            if capabilities.requires_connection_payment
            else Decimal("0.00")
        )

        transaction = Transaction(
            listing_id=listing.id,
            buyer_id=buyer_id,
            seller_id=seller_id,
            initiator_id=initiator_id,
            fee_amount=fee_amount or Decimal("0.00"),
            payment_required_from=PaymentRequiredFrom.BUYER,
            payer_id=initiator_id if not capabilities.requires_connection_payment else None,
            status=(
                TransactionStatus.PENDING_PAYMENT
                if capabilities.requires_connection_payment
                else TransactionStatus.PAID
            ),
        )

        session.add(transaction)

        await session.commit()
        await session.refresh(transaction)

        return transaction


    async def create_wanted_post_connection(
        self,
        wanted_post: WantedPost,
        initiator_id: UUID,
        session: AsyncSession,
    ) -> Transaction:
        if wanted_post.requester_id == initiator_id:
            raise HTTPException(
                status_code=400,
                detail="You cannot respond to your own wanted post.",
            )

        if not wanted_post.is_open:
            raise HTTPException(
                status_code=400,
                detail="This wanted post is no longer open.",
            )

        user = await session.get(User, initiator_id)
        if user is None:
            raise HTTPException(status_code=404, detail="User not found.")
        capabilities = self.billing_service.get_capabilities(user)
        fee_amount = (
            self.billing_service.get_connection_fee()
            if capabilities.requires_connection_payment
            else Decimal("0.00")
        )

        transaction = Transaction(
            wanted_id=wanted_post.id,
            buyer_id=wanted_post.requester_id,
            seller_id=initiator_id,
            initiator_id=initiator_id,
            fee_amount=fee_amount or Decimal("0.00"),
            payment_required_from=PaymentRequiredFrom.SELLER,
            payer_id=initiator_id if not capabilities.requires_connection_payment else None,
            status=(
                TransactionStatus.PENDING_PAYMENT
                if capabilities.requires_connection_payment
                else TransactionStatus.PAID
            ),
        )

        session.add(transaction)

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

        if transaction.initiator_id == user_id:
            raise HTTPException(
                status_code=403,
                detail=(
                    "The transaction initiator cannot decline "
                    "their own payment request."
                ),
            )

        if user_id not in {transaction.buyer_id, transaction.seller_id}:
            raise HTTPException(
                status_code=403,
                detail="You are not a participant in this transaction.",
            )

        transaction.status = TransactionStatus.CANCELLED

        await session.commit()
        await session.refresh(transaction)

        return transaction

    async def get_transaction_for_participant(
        self,
        *,
        transaction_id: UUID,
        user_id: UUID,
        session: AsyncSession,
    ) -> Transaction:
        result = await session.execute(
            select(Transaction).where(
                Transaction.id == transaction_id,
                (Transaction.buyer_id == user_id) | (Transaction.seller_id == user_id),
            )
        )
        transaction = result.scalar_one_or_none()
        if transaction is None:
            raise HTTPException(status_code=404, detail="Transaction not found.")
        return transaction
