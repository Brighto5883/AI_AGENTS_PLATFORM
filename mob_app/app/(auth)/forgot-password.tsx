import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { resetPassword } from "@/services/authService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({ email: email.trim(), newPassword });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <View className="flex-1 justify-center bg-homepage p-6">
        <Text className="mb-4 text-2xl font-bold">Password updated</Text>
        <Text className="mb-8 text-gray-600">
          You can now log in with your new password.
        </Text>
        <Pressable onPress={() => router.replace("/login")} className="rounded bg-blue-600 p-4">
          <Text className="text-center font-bold text-white">Back to login</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center bg-homepage p-6">
      <Text className="mb-2 text-3xl font-bold">Reset password</Text>
      <Text className="mb-8 text-sm text-gray-500">
        Enter your account email and a new password.
      </Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        className="mb-4 rounded border p-4"
      />
      <TextInput
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="New password"
        secureTextEntry
        className="mb-4 rounded border p-4"
      />
      <TextInput
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Confirm new password"
        secureTextEntry
        className="mb-2 rounded border p-4"
      />

      {error ? <Text className="mb-4 text-red-600">{error}</Text> : null}

      <Pressable onPress={handleSubmit} disabled={isLoading} className="rounded bg-blue-600 p-4">
        <Text className="text-center font-bold text-white">
          {isLoading ? "Updating..." : "Reset password"}
        </Text>
      </Pressable>

      <Pressable onPress={() => router.replace("/login")} className="mt-4">
        <Text className="text-center">Back to login</Text>
      </Pressable>
    </View>
  );
}