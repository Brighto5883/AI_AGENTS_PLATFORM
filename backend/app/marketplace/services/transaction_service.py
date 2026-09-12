from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models.listing import Listing
from app.database.models.transaction import Transaction
from app.database.models.wanted_post import WantedPost
from app.marketplace.enums import PaymentRequiredFrom, TransactionStatus
from app.pricing.marketplace_pricing_service import MarketplacePricingService


class TransactionService:

    def __init__(
        self,
        pricing_service: MarketplacePricingService,
    ):
        self.pricing_service = pricing_service


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

        transaction = Transaction(
            listing_id=listing.id,
            buyer_id=buyer_id,
            seller_id=seller_id,
            initiator_id=initiator_id,
            fee_amount = self.pricing_service.get_service_fee(
                category=listing.category,
                amount=listing.price,
            ),
            payment_required_from=PaymentRequiredFrom.BUYER,
            payer_id=None,
            status=TransactionStatus.PENDING_PAYMENT,
        )

        session.add(transaction)

        await session.flush()

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

        transaction = Transaction(
            wanted_id=wanted_post.id,
            buyer_id=wanted_post.requester_id,
            seller_id=initiator_id,
            initiator_id=initiator_id,
            fee_amount=self.pricing_service.get_service_fee(
                category=wanted_post.category,
                amount=wanted_post.budget,
            ),
            payment_required_from=PaymentRequiredFrom.SELLER,
            payer_id=None,
            status=TransactionStatus.PENDING_PAYMENT,
        )

        session.add(transaction)

        await session.flush()

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

        transaction.status = TransactionStatus.CANCELLED

        await session.commit()
        await session.refresh(transaction)

        return transaction
