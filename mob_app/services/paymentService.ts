
import { apiFetch } from "@/services/api";
import type {
  CreateDonationInput,
  DonationResponse,
  PaymentStatusResponse,
  PaymentVerificationResult,
  VerifyTransactionInput,
  CreateMarketplacePaymentInput,
  MarketplacePaymentResponse,
} from "@/types/payment";


// ================================================================================================
export async function createDonation(
  input: CreateDonationInput,
): Promise<DonationResponse> {
  const response = await apiFetch(
    "/payments/donations",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: input.amount,
        phone_number: input.phoneNumber,
      }),
    },
  );

  const responseText = await response.text();

  if (!response.ok) {
    console.error(
      "Create donation failed:",
      response.status,
      responseText,
    );

    let message = "Failed to initiate donation.";

    try {
      const errorBody = JSON.parse(responseText);

      if (typeof errorBody.detail === "string") {
        message = errorBody.detail;
      }
    } catch {
      if (responseText) {
        message = responseText;
      }
    }

    throw new Error(message);
  }

  return JSON.parse(responseText) as DonationResponse;
}

// ================================================================================================
export async function createMarketplacePayment(
  transactionId: string,
  input: CreateMarketplacePaymentInput,
): Promise<MarketplacePaymentResponse> {
  const response = await apiFetch(
    `/payments/marketplace/transactions/${transactionId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone_number: input.phoneNumber,
      }),
    },
  );

  const responseText = await response.text();

  if (!response.ok) {
    let message = "Failed to initiate payment.";

    try {
      const errorBody = JSON.parse(responseText);

      if (typeof errorBody.detail === "string") {
        message = errorBody.detail;
      }
    } catch {
      if (responseText) {
        message = responseText;
      }
    }

    throw new Error(message);
  }

  return JSON.parse(responseText) as MarketplacePaymentResponse;
}
// ================================================================================================
export async function getPaymentStatus(
  paymentId: string,
): Promise<PaymentStatusResponse> {
  const response = await apiFetch(
    `/payments/${paymentId}`,
    {
      method: "GET",
    },
  );

  const responseText = await response.text();

  if (!response.ok) {
    console.error(
      "Get payment status failed:",
      response.status,
      responseText,
    );

    let message = "Failed to check payment status.";

    try {
      const errorBody = JSON.parse(responseText);

      if (typeof errorBody.detail === "string") {
        message = errorBody.detail;
      }
    } catch {
      if (responseText) {
        message = responseText;
      }
    }

    throw new Error(message);
  }

  return JSON.parse(responseText) as PaymentStatusResponse;
}

// ===================================================================================
export async function verifyPaymentTransaction(
  paymentId: string,
  input: VerifyTransactionInput,
): Promise<PaymentVerificationResult> {
  const response = await apiFetch(
    `/payments/${paymentId}/verify-transaction`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transaction_code: input.transactionCode,
      }),
    },
  );

  const responseText = await response.text();

  if (!response.ok) {
    console.error(
      "Verify payment transaction failed:",
      response.status,
      responseText,
    );

    let message = "We could not verify the payment.";

    try {
      const errorBody = JSON.parse(responseText);

      if (typeof errorBody.detail === "string") {
        message = errorBody.detail;
      }
    } catch {
      if (responseText) {
        message = responseText;
      }
    }

    throw new Error(message);
  }

  return JSON.parse(responseText) as PaymentVerificationResult;
}