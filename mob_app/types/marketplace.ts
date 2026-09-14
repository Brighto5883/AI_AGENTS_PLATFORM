export const categories = [
  'Electonics(phones)',
  'Electronics(Others)',
  'Household Items',
  'Hostels and rentals',
  "Services",
  "Laptops",
  "fashion",
  "jobs",
  "other",
] as const;

export type MarketplaceCategory = typeof categories[number];

export interface Contactable {
  id: string;
  name: string | null;
  phone: string | null;
}

export type ListingImage = {
  id: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  display_order: number;
  url: string;
};

/*Equivalent to ListingResponse from the backend*/
export type Listing = { 
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
  contact_unlocked: boolean;
  images: ListingImage[];
  seller: Contactable;
};
export type ListingSort =
  | "recent"
  | "price_asc"
  | "price_desc";

export type ListingFilters = {
  search?: string;
  category?: MarketplaceCategory;
  min_price?: number;
  max_price?: number;
  sort?: ListingSort;
  limit?: number;
  offset?: number;
};

/* Response from the backend 'marketplace/get_listings/ */
export type ListingsResponse = {
  items: Listing[];
  next_offset: number;
  has_more: boolean;
};

export interface WantedPost {
  id: string;
  requester_id: string;
  title: string;
  description: string;
  category: MarketplaceCategory;
  budget: string | null;
  is_open: boolean;
  created_at: string;
  contact_unlocked: boolean;
  requester: Contactable;
}

export interface WantedPostCreateInput {
  title: string;
  description: string;
  category: MarketplaceCategory;
  budget?: number;
}

export type TransactionStatus =
| "pending_payment"
| "paid"
| "failed"
| "cancelled"
| "expired";

export type PaymentRequiredFrom =
  | "buyer"
  | "seller";

export interface Transaction {
  id: string;
  listing_id: string | null;
  wanted_id: string | null;
  buyer_id: string;
  seller_id: string;
  initiator_id: string;
  fee_amount: string;
  payment_required_from: PaymentRequiredFrom;
  payer_id: string | null;
  status: TransactionStatus;
  payment_reference: string | null;
  paid_at: string | null;
  created_at: string;
}
  