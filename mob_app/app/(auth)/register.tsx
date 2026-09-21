import { useTransientError } from "@/hooks/useTransientError";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { registerUser } from "@/services/authService";
import { getUserFriendlyErrorMessage } from "@/utils/errorMessages";
import { router } from "expo-router";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useTransientError();
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

      if (error instanceof Error) {
        setError(
          getUserFriendlyErrorMessage(
            error,
            "Registration failed. Please check your details and try again.",
          ),
        );
      } else {
        setError("Registration failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled={Platform.OS !== "web"}
    >
      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerClassName="flex-grow items-center justify-center px-5 py-10"
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-xl">
          <View className="mb-8 items-center">
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-gray-950">
              <Text className="text-2xl text-white">✦</Text>
            </View>

            <Text className="text-center text-3xl font-bold tracking-tight text-gray-950">
              Welcome to Campus Hub
            </Text>

            <Text className="mt-3 max-w-md text-center text-base leading-6 text-gray-600">
              Create your account and get access to a growing collection of
              campus services, tools, and intelligent experiences.
            </Text>
          </View>

          <View className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <Text className="mb-1 text-xl font-bold text-gray-950">
              Create your account
            </Text>

            <Text className="mb-6 text-sm leading-5 text-gray-500">
              It only takes a moment. You can explore the platform once you're
              signed in.
            </Text>

            <Text className="mb-2 text-sm font-semibold text-gray-700">
              Email
            </Text>

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoComplete="username"
              textContentType="username"
              keyboardType="email-address"
              className="mb-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900"
            />

            {emailError ? (
              <Text className="mb-4 text-sm text-red-600">
                {emailError}
              </Text>
            ) : null}

            <Text className="mb-2 text-sm font-semibold text-gray-700">
              Password
            </Text>

            <View className="mb-2 flex-row items-center rounded-xl border border-gray-200 bg-gray-50">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                placeholderTextColor="#9ca3af"
                autoComplete="new-password"
                textContentType="newPassword"
                importantForAutofill="yes"
                secureTextEntry={!showPassword}
                className="flex-1 px-4 py-3.5 text-gray-900"
              />

              <Pressable
                onPress={() => setShowPassword((visible) => !visible)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                className="px-4 py-3.5"
              >
                <Text className="text-sm font-semibold text-gray-600">
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </Pressable>
            </View>

            {passwordError ? (
              <Text className="mb-4 text-sm text-red-600">
                {passwordError}
              </Text>
            ) : null}

            {error ? (
              <View className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3">
                <Text className="text-sm leading-5 text-red-700">
                  {error}
                </Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleRegister}
              disabled={isLoading}
              className={`rounded-xl px-4 py-3.5 ${
                isLoading ? "bg-gray-400" : "bg-gray-950"
              }`}
            >
              {isLoading ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text className="ml-2 font-bold text-white">
                    Creating account...
                  </Text>
                </View>
              ) : (
                <Text className="text-center font-bold text-white">
                  Create account
                </Text>
              )}
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.replace("/login")}
            className="mt-6"
          >
            <Text className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Text className="font-bold text-gray-950">
                Sign in
              </Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
