import { useTransientError } from "@/hooks/useTransientError";

import { useCallback, useState } from "react";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";

import WantedPostForm, {
  WantedPostFormSubmitData,
} from "@/components/marketplace/WantedPostForm";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile } from "@/services/authService";
import {
  getWantedPost,
  updateWantedPost,
} from "@/services/marketplaceService";
import { normalizePhone, validatePhone } from "@/utils/phone";
import { WantedPost } from "@/types/marketplace";

export default function EditWantedPost() {
  const { wantedId } = useLocalSearchParams<{
    wantedId: string;
  }>();

  const { user, refreshUser } = useAuth();

  const [wantedPost, setWantedPost] = useState<WantedPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useTransientError();

  const loadWantedPost = useCallback(async () => {
    if (!wantedId) {
      setError("Wanted post ID is missing.");
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      const data = await getWantedPost(wantedId);

      if (data.requester_id !== user?.id) {
        setError(
          "You do not have permission to edit this wanted post.",
        );
        return;
      }

      setWantedPost(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load wanted post.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [wantedId, user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadWantedPost();
    }, [loadWantedPost]),
  );

  const handleSubmit = async (
    data: WantedPostFormSubmitData,
  ) => {
    if (!wantedId) {
      setError("Wanted post ID is missing.");
      return;
    }

    setError(null);

    const phoneValidationError = validatePhone(data.phone);

    if (phoneValidationError) {
      setError(phoneValidationError);
      return;
    }

    try {
      setIsSubmitting(true);

      const normalizedPhone = normalizePhone(data.phone);

      if (normalizedPhone !== user?.phone) {
        await updateUserProfile({
          phone: normalizedPhone,
        });

        await refreshUser();
      }

      await updateWantedPost(wantedId, {
        title: data.title,
        description: data.description,
        category: data.category,
        budget: data.budget,
      });

      router.back();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update wanted post.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" />

        <Text className="mt-3 text-sm text-gray-500">
          Loading wanted post...
        </Text>
      </View>
    );
  }

  if (!wantedPost) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-5">
        <Text className="text-center text-base font-medium text-red-500">
          {error ?? "Wanted post could not be loaded."}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-40 pt-16"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-8">
          <Text className="text-sm font-semibold uppercase tracking-widest text-gray-500">
            KU Marketplace
          </Text>

          <Text className="mt-2 text-4xl font-bold text-gray-950">
            Edit request
          </Text>

          <Text className="mt-3 text-base leading-6 text-gray-500">
            Update what you are looking for.
          </Text>
        </View>

        {error && (
          <View className="mb-5">
            <Text className="text-sm font-medium text-red-500">
              {error}
            </Text>
          </View>
        )}

        <WantedPostForm
          initialTitle={wantedPost.title}
          initialDescription={wantedPost.description}
          initialCategory={
            wantedPost.category as WantedPostFormSubmitData["category"]
          }
          initialBudget={
            wantedPost.budget != null
              ? String(wantedPost.budget)
              : ""
          }
          initialPhone={user?.phone ?? ""}
          submitLabel="Save changes"
          submittingLabel="Saving changes..."
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

