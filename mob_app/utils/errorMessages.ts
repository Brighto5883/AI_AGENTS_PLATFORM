const ERROR_MESSAGES: Record<string, string> = {
  LOGIN_BAD_CREDENTIALS: "Incorrect email or password.",
  INVALID_CREDENTIALS: "Incorrect email or password.",
  USER_NOT_FOUND: "We couldn't find an account with those details.",
  EMAIL_ALREADY_REGISTERED: "An account with this email already exists.",
  USER_ALREADY_EXISTS: "An account with these details already exists.",
  INVALID_TOKEN: "Your session has expired. Please sign in again.",
  TOKEN_EXPIRED: "Your session has expired. Please sign in again.",
  ACCOUNT_NOT_FOUND: "We couldn't find your account.",
  ACCOUNT_DELETION_FAILED: "We couldn't delete your account. Please try again.",
  PHONE_NUMBER_REQUIRED: "Please enter your phone number.",
  INVALID_PHONE_NUMBER: "Please enter a valid phone number.",
  LISTING_NOT_FOUND: "This listing is no longer available.",
  WANTED_POST_NOT_FOUND: "This request is no longer available.",
  INSUFFICIENT_FUNDS: "There isn't enough money to complete this payment.",
  PAYMENT_FAILED: "The payment could not be completed. Please try again.",
};

export function getUserFriendlyErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.trim();

  if (!message) {
    return fallback;
  }

  return ERROR_MESSAGES[message] ?? message;
}
