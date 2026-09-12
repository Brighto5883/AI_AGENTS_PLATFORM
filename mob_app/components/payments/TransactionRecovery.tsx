import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import FeedbackButton from "@/components/feedback/feedbackButton";
import FeedbackModal from "@/components/feedback/FeedbackModal";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { verifyPaymentTransaction } from "@/services/paymentService";

interface TransactionRecoveryProps {
  paymentId: string;
  onVerified: () => void;
  onCancel: () => void;
}

export default function TransactionRecovery({
  paymentId,
  onVerified,
  onCancel,
}: TransactionRecoveryProps) {
  const [transactionCode, setTransactionCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);

  const handleVerify = async () => {
    const code = transactionCode.trim().toUpperCase();

    if (!/^[A-Z0-9]{8,20}$/.test(code)) {
      setErrorMessage("Enter a valid M-Pesa transaction code.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const result = await verifyPaymentTransaction(paymentId, {
        transactionCode: code,
      });

      if (!result.verified) {
        setErrorMessage(
          result.message || "The payment could not be verified.",
        );
        return;
      }

      onVerified();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not verify the payment.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="items-center py-6">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-amber-50">
        <Ionicons
          name="receipt-outline"
          size={34}
          color="#d97706"
        />
      </View>

      <Text className="mt-5 text-center text-xl font-bold text-gray-950">
        Confirm your payment
      </Text>

      <Text className="mt-2 text-center text-sm leading-5 text-gray-500">
        We couldn't confirm your payment automatically. If you
        completed the M-Pesa payment, enter the transaction code from
        your M-Pesa message.
      </Text>

      <TextInput
        value={transactionCode}
        onChangeText={(value) => {
          setTransactionCode(value.toUpperCase());

          if (errorMessage) {
            setErrorMessage(null);
          }
        }}
        placeholder="e.g. QK4A1B2C3D"
        placeholderTextColor="#9ca3af"
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!isSubmitting}
        className="mt-5 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-center font-semibold tracking-widest text-gray-900"
      />

      {errorMessage ? (
        <Text className="mt-2 text-center text-xs text-red-500">
          {errorMessage}
        </Text>
      ) : null}

      {errorMessage ? (
        <View className="mt-4 items-center">
          <FeedbackButton
            label="Report a payment problem"
            onPress={() => setFeedbackVisible(true)}
          />
        </View>
      ) : null}

      <Pressable
        onPress={() => void handleVerify()}
        disabled={isSubmitting}
        className="mt-5 w-full rounded-xl bg-gray-950 px-4 py-3.5"
        style={({ pressed }) => ({
          opacity: isSubmitting ? 0.5 : pressed ? 0.8 : 1,
        })}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-center font-bold text-white">
            Verify payment
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={onCancel}
        disabled={isSubmitting}
        className="mt-3 w-full rounded-xl px-4 py-3.5"
      >
        <Text className="text-center font-semibold text-gray-600">
          Cancel
        </Text>
      </Pressable>

      <FeedbackModal
        visible={feedbackVisible}
        onClose={() => setFeedbackVisible(false)}
        screen="payment"
      />
    </View>
  );
}