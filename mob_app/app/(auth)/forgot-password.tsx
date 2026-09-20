import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { resetPassword } from "@/services/authService";
import { useTransientError } from "@/hooks/useTransientError";
import { getUserFriendlyErrorMessage } from "@/utils/errorMessages";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useTransientError();

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    let valid = true;

    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    if (!email.trim()) {
      setEmailError("Email is required.");
      valid = false;
    } else if (!email.includes("@")) {
      setEmailError("Enter a valid email address.");
      valid = false;
    }

    if (!newPassword) {
      setPasswordError("Password is required.");
      valid = false;
    } else if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      valid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your new password.");
      valid = false;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async () => {
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword({
        email: email.trim(),
        newPassword,
      });

      setSuccess(true);
    } catch (error) {
      setError(
        getUserFriendlyErrorMessage(
          error,
          "We couldn't reset your password. Please try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        enabled={Platform.OS !== "web"}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            padding: 24,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full">
            <Text className="mb-2 text-3xl font-bold">
              Agentic Campus Services
            </Text>

            <Text className="mb-3 text-2xl font-bold">
              Password updated
            </Text>

            <Text className="mb-8 text-sm text-gray-500">
              Your password has been updated successfully. You can now log in
              with your new password.
            </Text>

            <Pressable
              onPress={() => router.replace("/login")}
              className="rounded bg-blue-600 p-4"
            >
              <Text className="text-center font-bold text-white">
                Back to login
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled={Platform.OS !== "web"}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 24,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full">
          <Text className="mb-2 text-3xl font-bold">
            Agentic Campus Services
          </Text>

          <Text className="mb-2 text-2xl font-bold">
            Reset password
          </Text>

          <Text className="mb-8 text-sm text-gray-500">
            Enter your email and choose a new password for your account.
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            keyboardType="email-address"
            className="mb-2 rounded border p-4"
          />

          {emailError ? (
            <Text className="mb-4 text-red-600">
              {emailError}
            </Text>
          ) : null}

          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New password"
            autoComplete="new-password"
            textContentType="newPassword"
            importantForAutofill="yes"
            secureTextEntry
            className="mb-2 rounded border p-4"
          />

          {passwordError ? (
            <Text className="mb-4 text-red-600">
              {passwordError}
            </Text>
          ) : null}

          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            autoComplete="new-password"
            textContentType="newPassword"
            importantForAutofill="yes"
            secureTextEntry
            className="mb-2 rounded border p-4"
          />

          {confirmPasswordError ? (
            <Text className="mb-4 text-red-600">
              {confirmPasswordError}
            </Text>
          ) : null}

          {error ? (
            <Text className="mb-4 text-red-600">
              {error}
            </Text>
          ) : null}

          <Pressable
            onPress={handleSubmit}
            disabled={isLoading}
            className="rounded bg-blue-600 p-4"
          >
            <Text className="text-center font-bold text-white">
              {isLoading ? "Updating..." : "Reset password"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace("/login")}
            className="mt-4"
          >
            <Text className="text-center">
              Back to login
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
