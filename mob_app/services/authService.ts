import type { LoginRequest, LoginResponse } from "@/types/auth";
import { env } from '@/config/env';

export async function loginUser(
  request: LoginRequest
): Promise<LoginResponse> {
  const form = new URLSearchParams();

  form.append("username", request.username);
  form.append("password", request.password);

  const response = await fetch(`${env.BACKEND_URL}/auth/jwt/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  if (!response.ok) {
    const error = await response.json();

    throw new Error(error.detail ?? "Login failed");
  }

  return response.json();
}

export async function registerUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const response = await fetch(`${env.BACKEND_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    const error = await response.json();

    throw new Error(error.detail ?? "Registration failed");
  }

  return response.json();
}