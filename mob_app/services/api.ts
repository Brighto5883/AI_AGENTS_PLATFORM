import { getToken } from "@/services/tokenService";
import { env } from "@/config/env";


export async function apiFetch(
  path: string,
  options: RequestInit = {}
) {
  const token = await getToken();

  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(`${env.BACKEND_URL}${path}`, {
    ...options,
    headers,
  });
}