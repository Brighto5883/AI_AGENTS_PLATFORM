import { getToken, removeToken } from "@/services/tokenService";
import { notifyUnauthorized } from "@/services/authEvents";
import { env } from "@/config/env";

let isHandlingUnauthorized = false;

export async function apiFetch(
  path: string,
  options: RequestInit = {}
) {
  const token = await getToken();

  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${env.BACKEND_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && token && !isHandlingUnauthorized) {
    isHandlingUnauthorized = true;

    try {
      await removeToken();
      notifyUnauthorized();
    } finally {
      // Allow the mechanism to work again after a future login.
      isHandlingUnauthorized = false;
    }
  }

  return response;
}