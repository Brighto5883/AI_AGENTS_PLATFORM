import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import {
  createMarketplacePayment,
  getPaymentStatus,
  verifyPaymentTransaction,
} from "@/services/paymentService";
import { normalizePhone, validatePhone } from "@/utils/phone";

type PaymentState =
  | "form"
  | "initiating"
  | "waiting"
  | "recovery"
  | "successful"
  | "failed";

const POLLING_INTERVAL_MS = 2500;
const MAX_POLL_ATTEMPTS = 24;

interface MarketplacePaymentModalProps {
  visible: boolean;
  listingId: string;
  amount: string;
  onClose: () => void;
  onSuccessful: () => void;
}

export default function MarketplacePaymentModal({
  visible,
  listingId,
  amount,
  onClose,
  onSuccessful,
}: MarketplacePaymentModalProps) {
  const { user } = useAuth();

  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [state, setState] = useState<PaymentState>("form");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [transactionCode, setTransactionCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setPhone(user?.phone ?? "");
    setPhoneError(null);
    setState("form");
    setPaymentId(null);
    setTransactionCode("");
    setErrorMessage(null);
    setSubmitting(false);
    attemptsRef.current = 0;
  }, [visible, user?.phone]);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, []);

  const resetPolling = () => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    attemptsRef.current = 0;
  };

  const handleClose = () => {
    if (
      state === "initiating" ||
      state === "waiting"
    ) {
      return;
    }

    resetPolling();
    onClose();
  };

  const pollPayment = async (id: string) => {
    attemptsRef.current += 1;

    try {
      const payment = await getPaymentStatus(id);

      if (payment.status === "successful") {
        resetPolling();
        setState("successful");
        onSuccessful();
        return;
      }

      if (
        payment.status === "failed" ||
        payment.status === "cancelled" ||
        payment.status === "expired"
      ) {
        resetPolling();
        setState("failed");
        setErrorMessage(
          payment.status === "expired"
            ? "The payment request expired."
            : "The payment was not completed.",
        );
        return;
      }

      if (attemptsRef.current >= MAX_POLL_ATTEMPTS) {
        resetPolling();
        setState("recovery");
        return;
      }

      pollTimerRef.current = setTimeout(() => {
        void pollPayment(id);
      }, POLLING_INTERVAL_MS);
    } catch {
      resetPolling();
      setState("recovery");
    }
  };

  const handlePay = async () => {
    const phoneValidation = validatePhone(phone);

    if (phoneValidation) {
      setPhoneError(phoneValidation);
      return;
    }

    setPhoneError(null);

    try {
      setSubmitting(true);
      setState("initiating");
      setErrorMessage(null);

      const result = await createMarketplacePayment(
        listingId,
        {
          phoneNumber: normalizePhone(phone),
        },
      );

      if (!result.payment_id) {
        throw new Error(
          "The payment was initiated without a payment reference.",
        );
      }

      setPaymentId(result.payment_id);
      setState("waiting");

      attemptsRef.current = 0;
      await pollPayment(result.payment_id);
    } catch (error) {
      setState("failed");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to initiate the payment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!paymentId) {
      return;
    }

    const code = transactionCode.trim().toUpperCase();

    if (!/^[A-Z0-9]{8,20}$/.test(code)) {
      setErrorMessage(
        "Enter a valid M-Pesa transaction code.",
      );
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const result = await verifyPaymentTransaction(
        paymentId,
        {
          transactionCode: code,
        },
      );

      if (!result.verified) {
        setErrorMessage(
          result.message ||
            "The payment could not be verified.",
        );
        return;
      }

      setState("successful");
      onSuccessful();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not verify the payment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 justify-center bg-black/50 px-5">
        <View className="rounded-3xl bg-white p-6">
          {state === "form" && (
            <>
              <Text className="text-2xl font-bold text-gray-950">
                Unlock contact
              </Text>

              <Text className="mt-2 text-sm leading-5 text-gray-500">
                Pay KES {amount} to contact the seller.
              </Text>

              <Text className="mt-5 text-sm font-semibold text-gray-700">
                M-Pesa phone number
              </Text>

              <TextInput
                value={phone}
                onChangeText={(value) => {
                  setPhone(value);
                  setPhoneError(null);
                }}
                keyboardType="phone-pad"
                placeholder="07XX XXX XXX"
                placeholderTextColor="#9ca3af"
                className="mt-2 rounded-xl border border-gray-200 px-4 py-3 text-gray-900"
              />

              {phoneError && (
                <Text className="mt-1 text-xs text-red-500">
                  {phoneError}
                </Text>
              )}

              <Pressable
                onPress={() => void handlePay()}
                disabled={submitting}
                className="mt-6 rounded-xl bg-gray-950 px-4 py-3.5"
              >
                <Text className="text-center font-bold text-white">
                  Pay KES {amount}
                </Text>
              </Pressable>
            </>
          )}

          {state === "initiating" && (
            <View className="items-center py-8">
              <ActivityIndicator size="large" />

              <Text className="mt-5 text-lg font-bold text-gray-950">
                Sending payment request...
              </Text>
            </View>
          )}

          {state === "waiting" && (
            <View className="items-center py-8">
              <Ionicons
                name="phone-portrait-outline"
                size={42}
                color="#16a34a"
              />

              <Text className="mt-5 text-xl font-bold text-gray-950">
                Check your phone
              </Text>

              <Text className="mt-2 text-center text-sm leading-5 text-gray-500">
                Approve the M-Pesa payment prompt to
                unlock the seller's contact.
              </Text>

              <View className="mt-6 flex-row items-center">
                <ActivityIndicator size="small" />

                <Text className="ml-2 text-sm text-gray-500">
                  Confirming payment...
                </Text>
              </View>
            </View>
          )}

          {state === "recovery" && (
            <>
              <Text className="text-xl font-bold text-gray-950">
                Confirm your payment
              </Text>

              <Text className="mt-2 text-sm leading-5 text-gray-500">
                If you completed the M-Pesa payment, enter
                the transaction code from your M-Pesa message.
              </Text>

              <TextInput
                value={transactionCode}
                onChangeText={(value) =>
                  setTransactionCode(value.toUpperCase())
                }
                placeholder="M-Pesa transaction code"
                placeholderTextColor="#9ca3af"
                autoCapitalize="characters"
                className="mt-5 rounded-xl border border-gray-200 px-4 py-3 text-center tracking-widest"
              />

              <Pressable
                onPress={() => void handleVerify()}
                disabled={submitting}
                className="mt-5 rounded-xl bg-gray-950 px-4 py-3.5"
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-center font-bold text-white">
                    Verify payment
                  </Text>
                )}
              </Pressable>
            </>
          )}

          {state === "successful" && (
            <View className="items-center py-6">
              <Ionicons
                name="checkmark-circle-outline"
                size={52}
                color="#16a34a"
              />

              <Text className="mt-4 text-xl font-bold text-gray-950">
                Payment successful
              </Text>

              <Text className="mt-2 text-center text-sm text-gray-500">
                You can now contact the seller.
              </Text>

              <Pressable
                onPress={onClose}
                className="mt-6 w-full rounded-xl bg-gray-950 px-4 py-3.5"
              >
                <Text className="text-center font-bold text-white">
                  Done
                </Text>
              </Pressable>
            </View>
          )}

          {state === "failed" && (
            <View className="items-center py-6">
              <Ionicons
                name="close-circle-outline"
                size={52}
                color="#dc2626"
              />

              <Text className="mt-4 text-xl font-bold text-gray-950">
                Payment not completed
              </Text>

              <Text className="mt-2 text-center text-sm text-gray-500">
                {errorMessage ||
                  "Something went wrong with the payment."}
              </Text>

              <Pressable
                onPress={() => {
                  setState("form");
                  setErrorMessage(null);
                }}
                className="mt-6 w-full rounded-xl bg-gray-950 px-4 py-3.5"
              >
                <Text className="text-center font-bold text-white">
                  Try again
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}