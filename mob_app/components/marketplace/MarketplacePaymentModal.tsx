import { useEffect, useRef, useState } from "react";
import PhoneNumberField from "@/components/marketplace/PhoneNumberField";
import type { Transaction } from "@/types/marketplace";
import type { PaymentStatusResponse } from "@/types/payment";
import { ActivityIndicator, Alert, Modal, Pressable, Text, View, } from "react-native";
import { createMarketplacePayment, getPaymentStatus, } from "@/services/paymentService";


interface Props {
  visible: boolean;
  transaction: Transaction | null;
  phoneNumber: string;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 20;

export default function MarketplacePaymentModal({
  visible,
  transaction,
  phoneNumber,
  onClose,
  onPaymentSuccess,
}: Props) {
  const [isStarting, setIsStarting] = useState(false);
  const [payment, setPayment] = useState<PaymentStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState(phoneNumber);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollAttemptsRef = useRef(0);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      stopPolling();
      setPayment(null);
      setError(null);
      setPhone(phoneNumber);
      setPhoneError(null);
      setIsStarting(false);
      pollAttemptsRef.current = 0;
    }
  }, [visible, phoneNumber]);

  useEffect(() => {
    if (!visible || !payment?.id) {
      return;
    }

    if (payment.status !== "pending") {
      return;
    }

    pollAttemptsRef.current = 0;

    pollingRef.current = setInterval(async () => {
      pollAttemptsRef.current += 1;

      try {
        const latestPayment = await getPaymentStatus(payment.id);

        setPayment(latestPayment);

        if (latestPayment.status === "successful") {
          stopPolling();
          onPaymentSuccess();
          return;
        }

        if (
          latestPayment.status === "failed" ||
          latestPayment.status === "cancelled" ||
          latestPayment.status === "expired"
        ) {
          stopPolling();
          return;
        }

        if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
          stopPolling();
        }
      } catch {
        if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
          stopPolling();
        }
      }
    }, POLL_INTERVAL_MS);

    return () => {
      stopPolling();
    };
  }, [visible, payment?.id, payment?.status, onPaymentSuccess]);

  if (!transaction) {
    return null;
  }

  const amount = Number(transaction.fee_amount);

  const formattedAmount = Number.isFinite(amount)
    ? amount.toLocaleString("en-KE", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })
    : transaction.fee_amount;

  const startPayment = async () => {
    if (isStarting || payment) {
      return;
    }

    const trimmedPhone = phone.trim();

    if (!trimmedPhone) {
      setPhoneError("Enter a phone number.");
      return;
    }

    try {
      setIsStarting(true);
      setError(null);
      setPhoneError(null);

      const result = await createMarketplacePayment(
        transaction.id,
        {
          phoneNumber: trimmedPhone,
        },
      );

      setPayment({
        id: result.payment_id,
        amount: result.amount,
        purpose: "marketplace_connection_fee",
        status: result.status,
        provider: result.provider,
        provider_reference: null,
        checkout_request_id: result.checkout_request_id,
        created_at: new Date().toISOString(),
        completed_at: null,
      });

      if (result.status === "successful") {
        onPaymentSuccess();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to start the payment.",
      );
    } finally {
      setIsStarting(false);
    }
  };

  const refreshPaymentStatus = async () => {
    if (!payment) {
      return;
    }

    try {
      setError(null);

      const latestPayment = await getPaymentStatus(payment.id);

      setPayment(latestPayment);

      if (latestPayment.status === "successful") {
        onPaymentSuccess();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to check payment status.",
      );
    }
  };

  const closeModal = () => {
    stopPolling();
    onClose();
  };

  const isPending = payment?.status === "pending";
  const isSuccessful = payment?.status === "successful";
  const isFailed =
    payment?.status === "failed" ||
    payment?.status === "cancelled" ||
    payment?.status === "expired";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={closeModal}
    >
      <View className="flex-1 justify-end bg-black/40">
        <View className="rounded-t-3xl bg-white px-5 pb-8 pt-6">
          <View className="mx-auto h-1.5 w-12 rounded-full bg-gray-200" />

          <Text className="mt-6 text-2xl font-bold text-gray-950">
            Unlock contact
          </Text>

          {!payment && (
            <>
              <Text className="mt-2 text-base leading-6 text-gray-600">
                Complete the connection payment to unlock this contact.
              </Text>

              <View className="mt-6 rounded-2xl bg-gray-50 p-5">
                <Text className="text-sm font-semibold text-gray-500">
                  Amount
                </Text>

                <Text className="mt-1 text-3xl font-bold text-gray-950">
                  KSh {formattedAmount}
                </Text>
              </View>

              <View className="mt-5">
                <PhoneNumberField
                  value={phone}
                  onChange={setPhone}
                  hasStoredNumber={!!phoneNumber}
                  error={phoneError}
                />
              </View>

              <Text className="mt-3 text-sm leading-5 text-gray-500">
                Enter the number that should receive the M-PESA payment prompt.
              </Text>

              {error && (
                <Text className="mt-4 text-sm font-medium text-red-500">
                  {error}
                </Text>
              )}

              <Pressable
                onPress={startPayment}
                disabled={isStarting}
                className="mt-6 rounded-2xl bg-gray-950 py-4"
                style={({ pressed }) => ({
                  opacity: pressed || isStarting ? 0.7 : 1,
                })}
              >
                {isStarting ? (
                  <View className="flex-row items-center justify-center">
                    <ActivityIndicator color="white" />

                    <Text className="ml-2 font-bold text-white">
                      Starting payment...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-center text-base font-bold text-white">
                    Continue
                  </Text>
                )}
              </Pressable>
            </>
          )}

          {isPending && (
            <View className="mt-6 items-center">
              <ActivityIndicator size="large" />

              <Text className="mt-5 text-center text-lg font-bold text-gray-950">
                Check your phone
              </Text>

              <Text className="mt-2 text-center leading-6 text-gray-500">
                Approve the payment request on your phone. We will
                automatically check for confirmation.
              </Text>

              <Pressable
                onPress={refreshPaymentStatus}
                className="mt-5 rounded-xl border-2 border-gray-950 px-6 py-3"
              >
                <Text className="font-semibold text-gray-950">
                  Check status
                </Text>
              </Pressable>
            </View>
          )}

          {isSuccessful && (
            <View className="mt-6 items-center">
              <Text className="text-5xl">✓</Text>

              <Text className="mt-4 text-xl font-bold text-gray-950">
                Contact unlocked
              </Text>

              <Text className="mt-2 text-center leading-6 text-gray-500">
                Your payment was confirmed successfully.
              </Text>

              <Pressable
                onPress={onPaymentSuccess}
                className="mt-6 w-full rounded-2xl bg-gray-950 py-4"
              >
                <Text className="text-center font-bold text-white">
                  Continue
                </Text>
              </Pressable>
            </View>
          )}

          {isFailed && (
            <View className="mt-6">
              <Text className="text-center text-xl font-bold text-gray-950">
                Payment was not completed
              </Text>

              <Text className="mt-2 text-center leading-6 text-gray-500">
                You can close this window and try the connection again.
              </Text>

              {error && (
                <Text className="mt-4 text-center text-sm text-red-500">
                  {error}
                </Text>
              )}

              <Pressable
                onPress={closeModal}
                className="mt-6 rounded-2xl bg-gray-950 py-4"
              >
                <Text className="text-center font-bold text-white">
                  Close
                </Text>
              </Pressable>
            </View>
          )}

          {!payment && (
            <Pressable
              onPress={closeModal}
              className="mt-3 py-3"
            >
              <Text className="text-center font-semibold text-gray-500">
                Cancel
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}