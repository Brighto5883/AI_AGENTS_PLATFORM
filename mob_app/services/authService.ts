import {
  apiFetch,
  getApiErrorMessage,
  publicApiFetch,
} from "@/services/api";
import type { AuthUser, LoginRequest, LoginResponse } from "@/types/auth";


// ==================================================================================
export async function registerUser({
  email,
  password,
  phone,
}: {
  email: string;
  password: string;
  phone?: string;
}) {
  const response = await publicApiFetch("/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      phone: phone || undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(response, "Registration failed. Please try again."),
    );
  }

  return response.json();
}

// ==================================================================================
export async function loginUser(
  request: LoginRequest,
): Promise<LoginResponse> {
  const form = new URLSearchParams();

  form.append("username", request.username);
  form.append("password", request.password);

  const response = await publicApiFetch("/auth/jwt/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(
        response,
        "Login failed. Check your email and password.",
      ),
    );
  }

  return response.json();
}

// ==================================================================================
export async function resetPassword({
  email,
  newPassword,
}: {
  email: string;
  newPassword: string;
}) {
  const response = await publicApiFetch("/auth/password-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      new_password: newPassword,
    }),
  });

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(
        response,
        "Password reset failed. Please try again.",
      ),
    );
  }

  return response.json();
}

// ==================================================================================
export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiFetch("/users/me");

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(response, "Failed to load your profile."),
    );
  }

  return response.json();
}

// ==================================================================================
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
    throw new Error(
      await getApiErrorMessage(
        response,
        "Failed to update your profile.",
      ),
    );
  }

  return response.json();
}

// ==================================================================================
export async function deleteAccount(): Promise<void> {
  const response = await apiFetch("/account", {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(
        response,
        "We couldn't delete your account. Please try again.",
      ),
    );
  }
}