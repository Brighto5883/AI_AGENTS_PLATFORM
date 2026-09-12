import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { submitFeedback } from "@/services/feedbackService";
import type { FeedbackCategory } from "@/types/feedback";

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  screen?: string;
  title?: string;
  description?: string;
}

const categories: { value: FeedbackCategory; label: string }[] = [
  { value: "bug", label: "Something isn't working" },
  { value: "payment", label: "Payment problem" },
  { value: "marketplace", label: "Marketplace problem" },
  { value: "account", label: "Account / Login" },
  { value: "suggestion", label: "Suggestion" },
  { value: "general", label: "General feedback" },
];

export default function FeedbackModal({
  visible,
  onClose,
  screen,
  title = "Help us improve",
  description = "Tell us about a problem, suggestion, or anything you'd like us to improve.",
}: FeedbackModalProps) {
  const [category, setCategory] = useState<FeedbackCategory>("general");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setCategory("general");
    setMessage("");
    setErrorMessage(null);
    setSubmitted(false);
    setInputFocused(false);

    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);

    return () => clearTimeout(focusTimer);
  }, [visible]);

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    inputRef.current?.blur();
    onClose();
  };

  const handleCategorySelect = (value: FeedbackCategory) => {
    if (isSubmitting) {
      return;
    }

    setCategory(value);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleSubmit = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      setErrorMessage("Please tell us what you'd like us to know.");
      inputRef.current?.focus();
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await submitFeedback({
        category,
        message: trimmedMessage,
        screen,
      });

      setSubmitted(true);
      inputRef.current?.blur();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not send your feedback.",
      );
      inputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-1 justify-center bg-black/60 px-4">
          <View className="max-h-[92%] overflow-hidden rounded-3xl border-2 border-gray-300 bg-white shadow-lg">
            <View className="p-6">
              <Pressable
                onPress={handleClose}
                disabled={isSubmitting}
                className="absolute right-4 top-4 z-10 h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-100"
              >
                <Ionicons name="close" size={20} color="#6b7280" />
              </Pressable>

              {submitted ? (
                <View className="items-center py-8">
                  <View className="h-16 w-16 items-center justify-center rounded-full bg-green-50">
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={42}
                      color="#16a34a"
                    />
                  </View>

                  <Text className="mt-5 text-center text-xl font-bold text-gray-950">
                    Thank you!
                  </Text>

                  <Text className="mt-2 text-center text-sm leading-5 text-gray-500">
                    Your feedback helps us identify problems and improve the
                    platform.
                  </Text>

                  <Pressable
                    onPress={handleClose}
                    className="mt-6 w-full rounded-xl bg-gray-950 px-4 py-3.5"
                  >
                    <Text className="text-center font-bold text-white">
                      Done
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerClassName="pb-2"
                >
                  <Text className="pr-10 text-2xl font-bold text-gray-950">
                    {title}
                  </Text>

                  <Text className="mt-2 pr-2 text-sm leading-5 text-gray-500">
                    {description}
                  </Text>

                  <Text className="mt-6 text-sm font-bold text-gray-800">
                    What is this about?
                  </Text>

                  <View className="mt-3 gap-2">
                    {categories.map((item) => {
                      const selected = category === item.value;

                      return (
                        <Pressable
                          key={item.value}
                          onPress={() => handleCategorySelect(item.value)}
                          disabled={isSubmitting}
                          className={`rounded-xl border-2 px-4 py-3 ${
                            selected
                              ? "border-gray-950 bg-gray-950"
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          <Text
                            className={`font-medium ${
                              selected
                                ? "text-white"
                                : "text-gray-700"
                            }`}
                          >
                            {item.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Feedback input section */}
                  <View
                    className={`mt-6 rounded-2xl border-2 p-3 ${
                      inputFocused
                        ? "border-gray-950 bg-gray-50"
                        : "border-gray-300 bg-gray-50"
                    }`}
                  >
                    <Text className="text-sm font-bold text-gray-900">
                      Tell us more
                    </Text>

                    <Text className="mt-1 text-xs leading-4 text-gray-500">
                      Describe what happened or tell us what you would like us
                      to improve.
                    </Text>

                    <TextInput
                      ref={inputRef}
                      value={message}
                      onChangeText={(value) => {
                        setMessage(value);

                        if (errorMessage) {
                          setErrorMessage(null);
                        }
                      }}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      placeholder="Start typing your feedback..."
                      placeholderTextColor="#9ca3af"
                      multiline
                      textAlignVertical="top"
                      maxLength={5000}
                      editable={!isSubmitting}
                      autoCorrect
                      className="mt-3 min-h-36 rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-base leading-5 text-gray-900"
                    />

                    <View className="mt-2 flex-row items-center justify-between">
                      <Text className="text-xs text-gray-400">
                        Your feedback is private.
                      </Text>

                      <Text className="text-xs text-gray-400">
                        {message.length}/5000
                      </Text>
                    </View>
                  </View>

                  {errorMessage ? (
                    <View className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
                      <Text className="text-xs font-medium text-red-600">
                        {errorMessage}
                      </Text>
                    </View>
                  ) : null}

                  <Pressable
                    onPress={() => void handleSubmit()}
                    disabled={isSubmitting}
                    className="mt-5 rounded-xl bg-gray-950 px-4 py-3.5"
                    style={({ pressed }) => ({
                      opacity: isSubmitting
                        ? 0.5
                        : pressed
                          ? 0.8
                          : 1,
                    })}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text className="text-center font-bold text-white">
                        Send feedback
                      </Text>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={handleClose}
                    disabled={isSubmitting}
                    className="mt-2 px-4 py-3"
                  >
                    <Text className="text-center font-semibold text-gray-600">
                      Maybe later
                    </Text>
                  </Pressable>
                </ScrollView>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}