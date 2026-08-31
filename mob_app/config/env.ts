const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error(
    "EXPO_PUBLIC_API_URL is not configured. Check your .env file."
  );
}

export const env = {
  BACKEND_URL,
} as const;