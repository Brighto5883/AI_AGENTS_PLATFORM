import { apiFetch, publicApiFetch } from "@/lib/api";

import type {
  AgentResult,
  AuthUser,
  BillingInfo,
  ConversationThread,
  Draft,
  Listing,
  MarketplaceCategory,
  PaymentStatus,
  Transaction,
  WantedPost,
} from "@/types";

/* -------------------------------------------------------------------------- */
/* Authentication                                                             */
/* -------------------------------------------------------------------------- */

export async function login(email: string, password: string) {
  const form = new URLSearchParams({
    username: email,
    password,
  });

  return publicApiFetch<{ access_token: string; token_type: string }>(
    "/auth/jwt/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    }
  );
}

export async function register(
  email: string,
  password: string,
  phone?: string
) {
  return publicApiFetch("/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      phone: phone || undefined,
    }),
  });
}

export async function resetPassword(
  email: string,
  newPassword: string
) {
  return publicApiFetch("/auth/password-reset", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      new_password: newPassword,
    }),
  });
}

/* -------------------------------------------------------------------------- */
/* User                                                                       */
/* -------------------------------------------------------------------------- */

export const getMe = () => apiFetch<AuthUser>("/users/me");

export const updateMe = (data: {
  phone?: string;
  name?: string;
}) =>
  apiFetch<AuthUser>("/users/me", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

export const deleteMe = () =>
  apiFetch<void>("/account", {
    method: "DELETE",
  });

/* -------------------------------------------------------------------------- */
/* Billing                                                                    */
/* -------------------------------------------------------------------------- */

export async function getBilling() {
  return apiFetch<BillingInfo>("/marketplace/billing/info");
}

/* -------------------------------------------------------------------------- */
/* Marketplace - Listings                                                    */
/* -------------------------------------------------------------------------- */

export async function getListings(
  filters: {
    search?: string;
    category?: MarketplaceCategory;
    min_price?: number;
    max_price?: number;
    sort?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();

  return apiFetch<{
    items: Listing[];
    next_offset: number;
    has_more: boolean;
  }>(`/marketplace/listings/${query ? `?${query}` : ""}`);
}

export const getListing = (id: string) =>
  apiFetch<Listing>(`/marketplace/listings/${id}`);

export const getMyListings = () =>
  apiFetch<Listing[]>("/marketplace/listings/my-listings");

export const markListingSold = (id: string) =>
  apiFetch<Listing>(`/marketplace/listings/${id}/sold`, {
    method: "PATCH",
  });

export const deleteListing = (id: string) =>
  apiFetch<void>(`/marketplace/listings/${id}`, {
    method: "DELETE",
  });

export const updateListing = (
  id: string,
  data: Partial<
    Pick<Listing, "title" | "description" | "price" | "category">
  >
) =>
  apiFetch<Listing>(`/marketplace/listings/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

export async function createListing(data: {
  title: string;
  description: string;
  price: string;
  category: string;
  images: File[];
}) {
  const form = new FormData();

  form.append("title", data.title);
  form.append("description", data.description);
  form.append("price", data.price);
  form.append("category", data.category);

  data.images.forEach((image) => {
    form.append("images", image);
  });

  return apiFetch<Listing>("/marketplace/listings/", {
    method: "POST",
    body: form,
  });
}

export async function addListingImages(
  id: string,
  images: File[]
) {
  const form = new FormData();

  images.forEach((image) => {
    form.append("images", image);
  });

  return apiFetch<Listing>(`/marketplace/listings/${id}/images`, {
    method: "POST",
    body: form,
  });
}

export const deleteListingImage = (
  listingId: string,
  imageId: string
) =>
  apiFetch<void>(
    `/marketplace/listings/${listingId}/images/${imageId}`,
    {
      method: "DELETE",
    }
  );

/* -------------------------------------------------------------------------- */
/* Marketplace - Wanted Posts                                                */
/* -------------------------------------------------------------------------- */

export const getWanted = () =>
  apiFetch<WantedPost[]>("/marketplace/wanted/");

export const getMyWanted = () =>
  apiFetch<WantedPost[]>("/marketplace/wanted/my-posts");

export const getWantedPost = (id: string) =>
  apiFetch<WantedPost>(`/marketplace/wanted/${id}`);

export const createWanted = (data: {
  title: string;
  description: string;
  category: string;
  budget?: number;
}) =>
  apiFetch<WantedPost>("/marketplace/wanted/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

export const updateWanted = (
  id: string,
  data: {
    title?: string;
    description?: string;
    category?: string;
    budget?: string;
  }
) =>
  apiFetch<WantedPost>(`/marketplace/wanted/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...data,
      budget: data.budget?.trim()
        ? Number(data.budget)
        : data.budget === ""
          ? null
          : undefined,
    }),
  });

export const fulfillWanted = (id: string) =>
  apiFetch<WantedPost>(`/marketplace/wanted/${id}/fulfilled`, {
    method: "PATCH",
  });

export const deleteWanted = (id: string) =>
  apiFetch<void>(`/marketplace/wanted/${id}`, {
    method: "DELETE",
  });

/* -------------------------------------------------------------------------- */
/* Marketplace - Transactions & Payments                                     */
/* -------------------------------------------------------------------------- */

export const connectListing = (id: string) =>
  apiFetch<Transaction>(
    `/marketplace/transactions/listings/${id}/connect`,
    {
      method: "POST",
    }
  );

export const connectWanted = (id: string) =>
  apiFetch<Transaction>(
    `/marketplace/wanted/${id}/connect`,
    {
      method: "POST",
    }
  );

export const payTransaction = (
  id: string,
  phone: string
) =>
  apiFetch<{
    payment_id: string;
    amount: string;
    status: string;
    provider: string;
    checkout_request_id: string | null;
    message: string;
  }>(`/payments/marketplace/transactions/${id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone_number: phone,
    }),
  });

export const paymentStatus = (id: string) =>
  apiFetch<PaymentStatus>(`/payments/${id}`);

export const verifyPayment = (
  id: string,
  code: string
) =>
  apiFetch<{
    verified: boolean;
    provider_reference: string | null;
    amount: number | null;
    message: string;
  }>(`/payments/${id}/verify-transaction`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transaction_code: code,
    }),
  });

/* -------------------------------------------------------------------------- */
/* Road Design Agent                                                          */
/* -------------------------------------------------------------------------- */

export async function submitRoad(
  query: string,
  file?: File
) {
  const form = new FormData();

  form.append("query", query);
  form.append("method", "auto");

  if (file) {
    form.append("file", file);
  }

  return apiFetch<AgentResult>("/query/", {
    method: "POST",
    body: form,
  });
}

/* -------------------------------------------------------------------------- */
/* Drafts                                                                     */
/* -------------------------------------------------------------------------- */

export const getDrafts = () =>
  apiFetch<Draft[]>("/drafts/?status=pending");

export const getDraftThread = (id: string) =>
  apiFetch<ConversationThread>(`/drafts/${id}/thread`);

export const approveDraft = (
  id: string,
  editedContent?: string
) =>
  apiFetch<Draft>(`/drafts/${id}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      edited_content: editedContent ?? null,
    }),
  });

export const rejectDraft = (
  id: string,
  reason?: string
) =>
  apiFetch<Draft>(`/drafts/${id}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reason: reason ?? null,
    }),
  });

export const sendDraft = (id: string) =>
  apiFetch<Draft>(`/drafts/${id}/send`, {
    method: "POST",
  });

/* -------------------------------------------------------------------------- */
/* Feedback                                                                   */
/* -------------------------------------------------------------------------- */

export const submitFeedback = (
  category: string,
  message: string,
  screen: string
) =>
  apiFetch("/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      category,
      message,
      screen,
    }),
  });

/* -------------------------------------------------------------------------- */
/* Road Agent History                                                         */
/* -------------------------------------------------------------------------- */

export const getHistory = () =>
  apiFetch<
    Array<{
      id: string;
      query: string;
      answer: string;
      document: string | null;
      method: string;
      created_at: string;
    }>
  >("/feed/");

export const deleteHistory = (id: string) =>
  apiFetch(`/feed/${id}`, {
    method: "DELETE",
  });

/* -------------------------------------------------------------------------- */
/* Donations                                                                  */
/* -------------------------------------------------------------------------- */

export const createDonation = (
  amount: number,
  phone: string
) =>
  apiFetch<{
    payment_id: string;
    amount: string;
    status: string;
    message: string;
  }>("/payments/donations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      phone_number: phone,
    }),
  });