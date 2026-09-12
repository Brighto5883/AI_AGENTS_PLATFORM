import { apiFetch } from "@/services/api";
import type {
  FeedbackCategory,
  FeedbackResponse,
  SubmitFeedbackInput,
} from "@/types/feedback";

export async function submitFeedback(
  input: SubmitFeedbackInput,
): Promise<FeedbackResponse> {
  const response = await apiFetch("/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      category: input.category,
      message: input.message,
      screen: input.screen,
    }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    let message = "Failed to send feedback.";

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

  return JSON.parse(responseText) as FeedbackResponse;
}