import { apiFetch } from '@/services/api';
import type { AuthUser } from "@/types/auth";
import type { LoginRequest, LoginResponse } from "@/types/auth";
import { env } from '@/config/env';



export async function registerUser({
  email,
  password,
  phone,
}: {
  email: string;
  password: string;
  phone?: string;
}) {
  const response = await fetch(`${env.BACKEND_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      phone: phone || undefined
    }),
  });

  if (!response.ok) {
    const error = await response.json();

    throw new Error(error.detail ?? "Registration failed");
  }

  return response.json();
}

//====================================================================================
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

//====================================================================================
export async function resetPassword({
  email,
  newPassword,
}: {
  email: string;
  newPassword: string;
}) {
  const response = await fetch(`${env.BACKEND_URL}/auth/password-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, new_password: newPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail ?? "Password reset failed");
  }
  return response.json();
}

//====================================================================================
export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiFetch("/users/me");

  if (!response.ok) {
    throw new Error("Failed to load profile");
  }

  return response.json();
}

//====================================================================================
export async function updateUserProfile(data: {
  phone?: string;
  name?: string;
}): Promise<AuthUser> {
  const response = await apiFetch("/users/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail ?? "Failed to update profile");
  }

  return response.json();
}