export type PaymentStatus =
  | "pending"
  | "successful"
  | "failed"
  | "cancelled"
  | "expired";

export type PaymentProvider = 
| "mpesa"
| "paystack";

export type PaymentPurpose =
  | "donation"
  | "marketplace_listing_fee"
  | "marketplace_connection_fee";

// MARKETPLACE PAYMENTS except DONATION PAYMENTS
export type CreateMarketplacePaymentInput = {
  phoneNumber: string;
};

export type MarketplacePaymentResponse = {
  payment_id: string;
  amount: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  checkout_request_id: string | null;
  message: string;
};

// DONATION PAYMENT
export type CreateDonationInput = {
  amount: number;
  phoneNumber: string;
};

export type DonationResponse = {
  payment_id: string;
  amount: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  checkout_request_id: string | null;
  message: string;
};

// FETCHING A PAYMENT'S STATUS
export type PaymentStatusResponse = {
  id: string;
  amount: string;
  purpose: PaymentPurpose;
  status: PaymentStatus;
  provider: PaymentProvider;
  provider_reference: string | null;
  checkout_request_id: string | null;
  created_at: string;
  completed_at: string | null;
};

// TRANSACTION VERIFICATION
export type VerifyTransactionInput = {
  transactionCode: string;
};

export interface PaymentVerificationResult {
  verified: boolean;
  provider_reference: string | null;
  amount: number | null;
  message: string;
}

