from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class MpesaCallbackMetadataItem(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
    )

    name: str = Field(
        validation_alias="Name",
    )
    value: str | int | Decimal | None = Field(
        default=None,
        validation_alias="Value",
    )


class MpesaCallbackMetadata(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
    )

    item: list[MpesaCallbackMetadataItem] = Field(
        default_factory=list,
        validation_alias="Item",
    )


class MpesaStkCallback(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
    )

    merchant_request_id: str = Field(
        validation_alias="MerchantRequestID",
    )
    checkout_request_id: str = Field(
        validation_alias="CheckoutRequestID",
    )
    result_code: int = Field(
        validation_alias="ResultCode",
    )
    result_desc: str = Field(
        validation_alias="ResultDesc",
    )
    callback_metadata: MpesaCallbackMetadata | None = Field(
        default=None,
        validation_alias="CallbackMetadata",
    )


class MpesaCallbackBody(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
    )

    stk_callback: MpesaStkCallback = Field(
        validation_alias="stkCallback",
    )


class MpesaCallbackRequest(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
    )

    body: MpesaCallbackBody = Field(
        validation_alias="Body",
    )