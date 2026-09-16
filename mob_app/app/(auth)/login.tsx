import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { loginUser } from "@/services/authService";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { login } = useAuth();

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
    }

    return valid;
  };

  const handleLogin = async () => {
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginUser({
        username: email.trim(),
        password,
      });

      await login(result.access_token);

      router.replace("/home");

    } catch (error) {
      console.error("Login failed:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Login failed. Check your credentials.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center bg-homepage p-6">
      
      <Text className="mb-8 text-3xl font-bold">
        Agentic Campus Services
      </Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        autoComplete="username"
        textContentType="username"
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
        autoComplete="current-password"
        textContentType="password"
        importantForAutofill="yes"
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
        onPress={handleLogin}
        disabled={isLoading}
        className="rounded bg-blue-600 p-4"
      >
        <Text className="text-center font-bold text-white">
          {isLoading ? "Logging in..." : "Login"}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/register")}
        className="mt-4"
      >
        <Text className="text-center">
          Don't have an account? Register
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/forgot-password")}
        className="mt-3"
      >
        <Text className="text-center text-gray-500">
          Forgot password?
        </Text>
      </Pressable>

    </View>
  );
}
