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

import ListingForm, {
  ListingFormSubmitData,
} from "@/components/marketplace/ListingForm";
import { useAuth } from "@/context/AuthContext";
import { addListingImages, getListing, updateListing } from "@/services/marketplaceService";
import { updateUserProfile } from "@/services/authService";
import { normalizePhone, validatePhone } from "@/utils/phone";
import { Listing } from "@/types/marketplace";

export default function EditListing() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const { user, refreshUser } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useTransientError();

  const loadListing = useCallback(async () => {
    if (!listingId) {
      setError("Listing ID is missing.");
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      const data = await getListing(listingId);

      if (data.seller_id !== user?.id) {
        setError("You do not have permission to edit this listing.");
        return;
      }

      setListing(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load listing.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [listingId, user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadListing();
    }, [loadListing]),
  );

  const handleSubmit = async (data: ListingFormSubmitData) => {
    if (!listingId) {
      setError("Listing ID is missing.");
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

        void refreshUser().catch(() => undefined);
      }

      await updateListing(listingId, {
        title: data.title,
        description: data.description,
        price: data.price,
        category: data.category,
      });

      if (data.images.length > 0) {
        await addListingImages(listingId, data.images);
      }

      router.back();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update listing.",
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
          Loading listing...
        </Text>
      </View>
    );
  }

  if (!listing) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-5">
        <Text className="text-center text-base font-medium text-red-500">
          {error ?? "Listing could not be loaded."}
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
            Edit listing
          </Text>

          <Text className="mt-3 text-base leading-6 text-gray-500">
            Update your listing details.
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
          listingId={listing.id}
          initialTitle={listing.title}
          initialDescription={listing.description}
          initialPrice={String(listing.price)}
          initialCategory={
            listing.category as ListingFormSubmitData["category"]
          }
          initialPhone={user?.phone ?? ""}
          initialImages={listing.images}
          submitLabel="Save changes"
          submittingLabel="Saving changes..."
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
