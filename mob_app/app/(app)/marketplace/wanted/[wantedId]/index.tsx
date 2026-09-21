import { useTransientError } from "@/hooks/useTransientError";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import ContactActions from "@/components/marketplace/ContactActions";
import FeedbackButton from "@/components/feedback/feedbackButton";
import FeedbackModal from "@/components/feedback/FeedbackModal";
import { getWantedPost } from "@/services/marketplaceService";
import MarketplacePaymentModal from "@/components/marketplace/MarketplacePaymentModal";
import { createWantedConnection } from "@/services/marketplaceTransactionService";
import type { Transaction, WantedPost } from "@/types/marketplace";

//====================================================================================
export default function WantedDetail() {

  const { wantedId } = useLocalSearchParams<{
    wantedId: string
  }>();
// ---------------------------------------------------------------------------------
  const { user } = useAuth();
  const [post, setPost] = useState<WantedPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useTransientError();
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [connectionTransaction, setConnectionTransaction] =
    useState<Transaction | null>(null);

// ---------------------------------------------------------------------------------
  const loadWantedPost = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getWantedPost(wantedId);

      setPost(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load request.",
      );
    } finally {
      setIsLoading(false);
    }
  };

// ---------------------------------------------------------------------------------
useEffect(() => {

  void loadWantedPost();

}, [wantedId]);

// ---------------------------------------------------------------------------------
useEffect(() => {
  getWantedPost(wantedId)
    .then(setPost)
    .catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load request.")
    )
    .finally(() => setIsLoading(false));
}, [wantedId]);

const handleUnlockContact = async () => {
  if (!post || isUnlocking) {
    return;
  }

  if (!user?.phone) {
    Alert.alert(
      "Phone number required",
      "Add your phone number to your account before making a connection payment.",
    );
    return;
  }

  try {
    setIsUnlocking(true);

    const transaction = await createWantedConnection(post.id);

    setConnectionTransaction(transaction);
    setPaymentModalVisible(true);
  } catch (error) {
    Alert.alert(
      "Unable to continue",
      error instanceof Error
        ? error.message
        : "Failed to create the connection.",
    );
  } finally {
    setIsUnlocking(false);
  }
};

// ---------------------------------------------------------------------------------
useEffect(() => {
  getWantedPost(wantedId)
    .then(setPost)
    .catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load request.")
    )
    .finally(() => setIsLoading(false));
}, [wantedId]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" />
      </View>
    );
  }

// ---------------------------------------------------------------------------------
  if (error || !post) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Text className="text-center text-red-500">{error ?? "Not found."}</Text>
      </View>
    );
  }

// ---------------------------------------------------------------------------------
  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 20 }}>
      <View className="self-start rounded-full bg-gray-100 px-3 py-1">
        <Text className="text-xs font-semibold text-gray-600">{post.category}</Text>
      </View>

      <Text className="mt-3 text-3xl font-bold text-gray-950">{post.title}</Text>

      <Text className="mt-2 text-base font-semibold text-gray-700">
        {post.budget ? `Budget: KSh ${post.budget}` : "No budget set"}
      </Text>

      <Text className="mt-5 text-base leading-6 text-gray-600">
        {post.description}
      </Text>


      {/* Contact Seller/Buyer */}
      <ContactActions
        phone={post.requester.phone}
        contactName={null}
        contextLabel={post.title}
        isOwnPost={user?.id === post.requester.id}
        contactUnlocked={post.contact_unlocked}
        onUnlockContact={handleUnlockContact}
        isUnlocking={isUnlocking}
      />


      <View className="mt-5 rounded-2xl border border-gray-200 bg-white p-4">
        <Text className="text-sm font-bold text-gray-950">
          Something wrong with this request?
        </Text>

        <Text className="mt-1 text-xs leading-4 text-gray-500">
          Report a problem or tell us how we can improve the marketplace.
        </Text>

        <View className="mt-3 self-start">
          <FeedbackButton
            label="Report a problem / Give feedback"
            onPress={() => setFeedbackVisible(true)}
          />
        </View>
      </View>

      <FeedbackModal
        visible={feedbackVisible}
        onClose={() => setFeedbackVisible(false)}
        screen="marketplace_wanted"
      />


      {/* Payment Modal */}
      <MarketplacePaymentModal
        visible={paymentModalVisible}
        transaction={connectionTransaction}
        phoneNumber={user?.phone ?? ""}
        onClose={() => {
          setPaymentModalVisible(false);
          setConnectionTransaction(null);
        }}
        onPaymentSuccess={async () => {
          setPaymentModalVisible(false);
          setConnectionTransaction(null);
          await loadWantedPost();
        }}
      />
    </ScrollView>
  );
}
