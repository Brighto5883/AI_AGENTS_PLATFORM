export const categories = [
  "Electonics(phones)",
  "Electronics(Others)",
  "Household Items",
  "Hostels and rentals",
  "Services",
  "Laptops",
  "fashion",
  "jobs",
  "other",
] as const;

export type MarketplaceCategory = typeof categories[number];
export type ListingSort = "recent" | "price_asc" | "price_desc";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
}

export interface ListingImage {
  id: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  display_order: number;
  url: string;
}

export interface Contactable {
  id: string;
  name: string | null;
  phone: string | null;
}

export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: string;
  category: MarketplaceCategory;
  image_path: string | null;
  is_approved: boolean;
  is_active: boolean;
  needs_review: boolean;
  review_reason: string | null;
  created_at: string;
  sold_at: string | null;
  scheduled_deletion_at: string | null;
  contact_unlocked: boolean;
  images: ListingImage[];
  seller: Contactable;
}

export interface WantedPost {
  id: string;
  requester_id: string;
  title: string;
  description: string;
  category: MarketplaceCategory;
  budget: string | null;
  is_open: boolean;
  created_at: string;
  sold_at: string | null;
  scheduled_deletion_at: string | null;
  contact_unlocked: boolean;
  requester: Contactable;
}

export interface Transaction {
  id: string;
  listing_id: string | null;
  wanted_id: string | null;
  buyer_id: string;
  seller_id: string;
  initiator_id: string;
  fee_amount: string;
  payment_required_from: "buyer" | "seller";
  payer_id: string | null;
  status: "pending_payment" | "paid" | "failed" | "cancelled" | "expired";
  payment_reference: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface BillingPlan {
  mode: string;
  name: string;
  description: string;
  monthly_fee: string | null;
  listing_fee_per_item: string | null;
  connection_fee: string | null;
  includes_connection_fee: boolean;
  contact_access: string;
}

export interface BillingInfo {
  billing_enabled: boolean;
  current_mode: string;
  currency: string;
  notice_title: string;
  notice_message: string;
  plans: BillingPlan[];
}

export interface Draft {
  id: string;
  draft_content: string;
  status: string;
  created_at: string;
  conversation_id: string;
  customer_name?: string | null;
  customer_phone?: string | null;
}

export interface WhatsAppMessage {
  id: string;
  direction: "inbound" | "outbound";
  content: string;
  created_at: string;
}

export interface ConversationThread {
  conversation_id: string;
  customer_phone?: string;
  customer_name?: string | null;
  messages: WhatsAppMessage[];
}

export interface AgentResult {
  method: string;
  answer: string;
  document: string;
  cost: number;
}

export interface PaymentStatus {
  id: string;
  amount: string;
  purpose: string;
  status: "pending" | "successful" | "failed" | "cancelled" | "expired";
  provider: string;
  provider_reference: string | null;
  checkout_request_id: string | null;
  created_at: string;
  completed_at: string | null;
}
