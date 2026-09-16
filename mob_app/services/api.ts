import { getToken, removeToken } from "@/services/tokenService";
import { notifyUnauthorized } from "@/services/authEvents";
import { env } from "@/config/env";

let isHandlingUnauthorized = false;

function isNetworkError(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    (error instanceof Error &&
      /network|fetch|connection|internet|offline|timeout/i.test(error.message))
  );
}

export function getUserFriendlyNetworkMessage(): string {
  return "We couldn't connect right now. Check your internet connection and try again.";
}

export function isUserFriendlyNetworkError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message === getUserFriendlyNetworkMessage()
  );
}

async function fetchWithNetworkHandling(
  url: string,
  options: RequestInit,
): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (isNetworkError(error)) {
      throw new Error(getUserFriendlyNetworkMessage());
    }

    throw new Error("Something went wrong while connecting. Please try again.");
  }
}

/**
 * Authenticated API request.
 *
 * Network failures are normalized here so screens never expose the native
 * "Network request failed" / fetch implementation error to users.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await getToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetchWithNetworkHandling(
    `${env.BACKEND_URL}${path}`,
    {
      ...options,
      headers,
    },
  );

  if (response.status === 401 && token && !isHandlingUnauthorized) {
    isHandlingUnauthorized = true;

    try {
      await removeToken();
      notifyUnauthorized();
    } finally {
      isHandlingUnauthorized = false;
    }
  }

  return response;
}

/**
 * Public API request for authentication endpoints.
 * Unlike apiFetch, this does not attach a stored token or react to 401.
 */
export async function publicApiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetchWithNetworkHandling(`${env.BACKEND_URL}${path}`, options);
}

/**
 * Safely extract a useful backend message without exposing raw JSON blobs.
 */
export async function getApiErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = await response.json();
    const detail = body?.detail;

    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }

    if (
      detail &&
      typeof detail === "object" &&
      typeof detail.message === "string"
    ) {
      return detail.message;
    }

    if (typeof body?.message === "string" && body.message.trim()) {
      return body.message;
    }
  } catch {
    // Ignore malformed/non-JSON error bodies.
  }

  return fallback;
}
