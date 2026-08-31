import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { registerUser } from "@/services/authService";
import { router } from "expo-router";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateForm = () => {
    let valid = true;

    setEmailError("");
    setPasswordError("");

    if (!email.trim()) {
      setEmailError("Email is required.");
      valid = false;
    } else if (!email.includes("@")) {
      setEmailError("Enter a valid email address.");
      valid = false;
    }

    if (!password) {
      setPasswordError("Password is required.");
      valid = false;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      valid = false;
    }

    return valid;
  };

  const handleRegister = async () => {
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await registerUser({
        email: email.trim(),
        password,
      });

      router.replace("/login");
    } catch (error) {
      console.error("Registration failed:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Registration failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center bg-homepage p-6">
      <Text className="mb-8 text-3xl font-bold">
        Create Account
      </Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        className="mb-2 rounded border p-4"
      />

      {emailError ? (
        <Text className="mb-4 text-red-600">
          {emailError}
        </Text>
      ) : null}

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        className="mb-2 rounded border p-4"
      />

      {passwordError ? (
        <Text className="mb-4 text-red-600">
          {passwordError}
        </Text>
      ) : null}

      {error ? (
        <Text className="mb-4 text-red-600">
          {error}
        </Text>
      ) : null}

      <Pressable
        onPress={handleRegister}
        disabled={isLoading}
        className="rounded bg-blue-600 p-4"
      >
        <Text className="text-center font-bold text-white">
          {isLoading ? "Creating account..." : "Register"}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.replace("/login")}
        className="mt-4"
      >
        <Text className="text-center">
          Already have an account? Login
        </Text>
      </Pressable>
    </View>
  );
}