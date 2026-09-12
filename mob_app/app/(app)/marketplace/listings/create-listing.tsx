
import { useState } from "react";
import { router } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";

import ListingForm, { ListingFormSubmitData, } from "@/components/marketplace/ListingForm";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile } from "@/services/authService";
import { createListing } from "@/services/marketplaceService";
import { normalizePhone, validatePhone } from "@/utils/phone";

//====================================================================================
export default function CreateListing() {
  const { user, refreshUser } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: ListingFormSubmitData) => {
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

      await createListing({
        title: data.title,
        description: data.description,
        price: data.price,
        category: data.category,
        images: data.images,
      });

      router.replace("/marketplace");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create listing.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Sell something
          </Text>

          <Text className="mt-3 text-base leading-6 text-gray-500">
            Create a listing and make it available to the KU community.
          </Text>
        </View>

        {error && (
          <View className="mb-5">
            <Text className="text-sm font-medium text-red-500">
              {error}
            </Text>
          </View>
        )}

        <ListingForm
          initialPhone={user?.phone ?? ""}
          submitLabel="Create listing"
          submittingLabel="Creating listing..."
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
