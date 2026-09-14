import { apiFetch } from "@/services/api";
import type { Transaction } from "@/types/marketplace";

async function getErrorMessage(
  responseText: string,
  fallback: string,
): Promise<string> {
  try {
    const errorBody = JSON.parse(responseText);

    if (typeof errorBody.detail === "string") {
      return errorBody.detail;
    }
  } catch {
    // Response wasn't JSON.
  }

  return responseText || fallback;
}

export async function createListingConnection(
  listingId: string,
): Promise<Transaction> {
  const response = await apiFetch(
    `/marketplace/transactions/listings/${listingId}/connect`,
    {
      method: "POST",
    },
  );

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        responseText,
        "Failed to create connection.",
      ),
    );
  }

  return JSON.parse(responseText) as Transaction;
}

export async function createWantedConnection(
  wantedId: string,
): Promise<Transaction> {
  const response = await apiFetch(
    `/marketplace/transactions/wanted/${wantedId}/connect`,
    {
      method: "POST",
    },
  );

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        responseText,
        "Failed to create connection.",
      ),
    );
  }

  return JSON.parse(responseText) as Transaction;
}