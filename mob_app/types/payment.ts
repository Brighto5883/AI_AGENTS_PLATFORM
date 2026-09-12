
export type PaymentStatus =
  | "pending"
  | "successful"
  | "failed"
  | "cancelled"
  | "expired";

export type PaymentProvider = "mpesa";

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

export type PaymentStatusResponse = {
  id: string;
  amount: string;
  purpose: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  provider_reference: string | null;
  checkout_request_id: string | null;
  created_at: string;
  completed_at: string | null;
};

export interface PaymentVerificationResult {
  verified: boolean;
  provider_reference: string | null;
  amount: number | null;
  message: string;

}
export type VerifyTransactionInput = {
  transactionCode: string;
};
