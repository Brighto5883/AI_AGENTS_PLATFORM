export type DraftStatus =
  | "pending"
  | "approved"
  | "edited"
  | "rejected"
  | "sent";

export type WhatsAppDraft = {
  id: string;
  draft_content: string;
  status: DraftStatus;
  created_at: string;
  conversation_id: string;
  customer_name?: string | null;
  customer_phone?: string | null;
};

export type WhatsAppMessage = {
  id: string;
  direction: "inbound" | "outbound";
  content: string;
  created_at: string;
};

export type ConversationThread = {
  conversation_id: string;
  customer_phone?: string;
  customer_name?: string | null;
  messages: WhatsAppMessage[];
};
