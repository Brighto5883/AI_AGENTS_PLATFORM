const API_BASE = (
  import.meta.env.VITE_BACKEND_URL || "/api"
).replace(/\/$/, "");

/* -------------------------------------------------------------------------- */
/* API Error                                                                  */
/* -------------------------------------------------------------------------- */

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);

    this.name = "ApiError";
    this.status = status;
  }
}

/* -------------------------------------------------------------------------- */
/* Network Errors                                                             */
/* -------------------------------------------------------------------------- */

function friendlyNetworkError(error: unknown): Error {
  if (error instanceof TypeError || error instanceof Error) {
    return new Error(
      "We couldn't connect right now. Check your internet connection and try again."
    );
  }

  return new Error(
    "Something went wrong while connecting. Please try again."
  );
}

/* -------------------------------------------------------------------------- */
/* API Error Messages                                                         */
/* -------------------------------------------------------------------------- */

async function errorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const body = await response.json();

    if (
      typeof body?.detail === "string" &&
      body.detail.trim()
    ) {
      return body.detail;
    }

    if (typeof body?.detail?.message === "string") {
      return body.detail.message;
    }

    if (
      typeof body?.message === "string" &&
      body.message.trim()
    ) {
      return body.message;
    }
  } catch {
    // Ignore malformed/non-JSON error bodies.
  }

  return fallback;
}

/* -------------------------------------------------------------------------- */
/* Authenticated API Requests                                                 */
/* -------------------------------------------------------------------------- */

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem(
    "campus_hub_access_token"
  );

  const headers = new Headers(options.headers);

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_BASE}${path}`,
      {
        ...options,
        headers,
      }
    );
  } catch (error) {
    throw friendlyNetworkError(error);
  }

  if (response.status === 401) {
    localStorage.removeItem(
      "campus_hub_access_token"
    );

    window.dispatchEvent(
      new Event("campus-hub:unauthorized")
    );
  }

  if (!response.ok) {
    throw new ApiError(
      await errorMessage(
        response,
        "Something went wrong. Please try again."
      ),
      response.status
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/* -------------------------------------------------------------------------- */
/* Public API Requests                                                        */
/* -------------------------------------------------------------------------- */

export async function publicApiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  let response: Response;

  try {
    response = await fetch(
      `${API_BASE}${path}`,
      {
        ...options,
        headers,
      }
    );
  } catch (error) {
    throw friendlyNetworkError(error);
  }

  if (!response.ok) {
    throw new ApiError(
      await errorMessage(
        response,
        "Something went wrong. Please try again."
      ),
      response.status
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}