export type MarketplaceBillingMode =
  | "connection_fee"
  | "listing_fee"
  | "subscription";

export type MarketplaceBillingPlan = {
  mode: MarketplaceBillingMode;
  name: string;
  description: string;
  monthly_fee: string | null;
  listing_fee_per_item: string | null;
  connection_fee: string | null;
  includes_connection_fee: boolean;
  contact_access: string;
};

export type MarketplaceBillingInfo = {
  billing_enabled: boolean;
  current_mode: string;
  currency: string;
  notice_title: string;
  notice_message: string;
  plans: MarketplaceBillingPlan[];
};
