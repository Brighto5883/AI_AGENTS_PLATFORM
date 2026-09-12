export type FeedbackCategory =
  | "bug"
  | "payment"
  | "marketplace"
  | "account"
  | "suggestion"
  | "general";

export interface SubmitFeedbackInput {
  category: FeedbackCategory;
  message: string;
  screen?: string;
}

export interface FeedbackResponse {
  id: string;
  category: FeedbackCategory;
  message: string;
  screen: string | null;
  created_at: string;
}