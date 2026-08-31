import type { WhatsAppDraft, ConversationThread, } from "@/types/whatsapp";

import { apiFetch } from "@/services/api";

export async function getPendingDrafts(): Promise<WhatsAppDraft[]> {
  const response = await apiFetch("/drafts/?status=pending");

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error.detail ?? `Failed to load drafts: ${response.status}`
    );
  }

  return response.json();
}

export async function getDraftThread(
  draftId: string
): Promise<ConversationThread> {
  const response = await apiFetch(`/drafts/${draftId}/thread`);

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error.detail ?? "Failed to load conversation."
    );
  }

  return response.json();
}

export async function approveDraft(
  draftId: string,
  editedText?: string | null
) {
  const response = await apiFetch(`/drafts/${draftId}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      edited_text: editedText ?? null,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to approve draft: ${response.status}`);
  }

  return response.json();
}

export async function rejectDraft(
  draftId: string
) {
  const response = await apiFetch(`/drafts/${draftId}/reject`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Failed to reject draft: ${response.status}`);
  }

  return response.json();
}

export async function sendDraft(
  draftId: string
) {
  const response = await apiFetch(`/drafts/${draftId}/send`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Failed to send draft: ${response.status}`);
  }

  return response.json();
}