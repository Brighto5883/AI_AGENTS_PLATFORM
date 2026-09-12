
import { Ionicons } from "@expo/vector-icons";
import TransactionRecovery from "./TransactionRecovery";
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
import { createDonation, getPaymentStatus } from "@/services/paymentService";
import { normalizePhone, validatePhone } from "@/utils/phone";

import DonationPhoneField from "./DonationPhoneField";


type DonationState =
  | "form"
  | "initiating"
  | "waiting"
  | "recovery"
  | "successful"
  | "failed";

const POLLING_INTERVAL_MS = 2500;
const MAX_POLL_ATTEMPTS = 24;

interface DonationModalProps {
  visible: boolean;
  onClose: () => void;
}

// ===================================================================================
export default function DonationModal({
  visible,
  onClose,
}: DonationModalProps) {
  const { user } = useAuth();

  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [donationState, setDonationState] = useState<DonationState>("form");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAttemptsRef = useRef(0);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setPaymentId(null);
    setAmount("");
    setPhone(user?.phone ?? "");
    setPhoneError(null);
    setAmountError(null);
    setErrorMessage(null);
    setDonationState("form");
    pollAttemptsRef.current = 0;
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

    pollAttemptsRef.current = 0;
  };

  // ===================================================================================
  const handleClose = () => {
    if (
      donationState === "initiating" ||
      donationState === "waiting" ||
      donationState === "recovery"
    ) {
      return;
    }

    resetPolling();
    onClose();
  };

// ===================================================================================
  const validateAmount = (): number | null => {
    const trimmedAmount = amount.trim();

    if (!trimmedAmount) {
      setAmountError("Donation amount is required.");
      return null;
    }

    const parsed = Number(trimmedAmount);

    if (!Number.isFinite(parsed)) {
      setAmountError("Enter a valid amount.");
      return null;
    }

    if (!Number.isInteger(parsed)) {
      setAmountError("Enter a whole amount in Kenyan shillings.");
      return null;
    }

    if (parsed < 10) {
      setAmountError("Minimum donation is KES 10.");
      return null;
    }

    if (parsed > 400_000) {
      setAmountError("Maximum donation is KES 400,000.");
      return null;
    }

    setAmountError(null);
    return parsed;
  };

  // ===================================================================================
  const validatePhoneNumber = (): string | null => {
    const error = validatePhone(phone);

    if (error) {
      setPhoneError(error);
      return null;
    }

    setPhoneError(null);

    return normalizePhone(phone);
  };

  // ===================================================================================
  const pollPaymentStatus = async (paymentId: string) => {
    pollAttemptsRef.current += 1;

    try {
      const payment = await getPaymentStatus(paymentId);

      if (payment.status === "successful") {
        resetPolling();
        setDonationState("successful");
        return;
      }

      if (
        payment.status === "failed" ||
        payment.status === "cancelled" ||
        payment.status === "expired"
      ) {
        resetPolling();
        setDonationState("failed");
        setErrorMessage(
          payment.status === "expired"
            ? "The M-Pesa payment request expired."
            : "The donation was not completed.",
        );
        return;
      }

      if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
        resetPolling();
        setDonationState("recovery");
        return;
      }

      pollTimerRef.current = setTimeout(() => {
        void pollPaymentStatus(paymentId);
      }, POLLING_INTERVAL_MS);
    } catch (error) {
      resetPolling();
      setDonationState("recovery");
    }
  };

  // =================================================================================== 
  const handleDonate = async () => {
    if (donationState !== "form") {
      return;
    }

    const validatedAmount = validateAmount();
    const normalizedPhone = validatePhoneNumber();

    if (validatedAmount === null || normalizedPhone === null) {
      return;
    }

    try {
      setDonationState("initiating");
      setErrorMessage(null);

      const result = await createDonation({
        amount: validatedAmount,
        phoneNumber: normalizedPhone,
      });

      if (!result.payment_id) {
        throw new Error(
          "The payment was initiated without a payment reference.",
        );
      }

      setPaymentId(result.payment_id);

      if (!result.status || result.status === "failed") {
        setDonationState("failed");
        setErrorMessage(
          result.message || "The M-Pesa request could not be initiated.",
        );
        return;
      }

      setDonationState("waiting");
      pollAttemptsRef.current = 0;

      await pollPaymentStatus(result.payment_id);
    } catch (error) {
      setDonationState("failed");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to initiate the donation.",
      );
    }
  };

// ===================================================================================
  const renderForm = () => (
    <>
      <View className="mb-5">
        <Text className="text-2xl font-bold text-gray-950">
          Support the platform
        </Text>

        <Text className="mt-2 text-sm leading-5 text-gray-500">
          Help us keep building useful AI-powered services for the KU
          community.
        </Text>
      </View>

      <Text className="text-sm font-semibold text-gray-700">
        Donation amount
      </Text>

      <View
        className={`mt-2 flex-row items-center rounded-xl border px-4 ${
          amountError
            ? "border-red-300 bg-red-50"
            : "border-gray-200 bg-white"
        }`}
      >
        <Text className="mr-2 text-sm font-semibold text-gray-500">
          KES
        </Text>

        <TextInput
          value={amount}
          onChangeText={(value) => {
            setAmount(value);
            if (amountError) {
              setAmountError(null);
            }
          }}
          placeholder="e.g. 100"
          placeholderTextColor="#9ca3af"
          keyboardType="number-pad"
          className="flex-1 py-3 text-gray-900"
        />
      </View>

      {amountError ? (
        <Text className="mt-1 text-xs text-red-500">
          {amountError}
        </Text>
      ) : null}

      <DonationPhoneField
        value={phone}
        onChange={(value) => {
          setPhone(value);

          if (phoneError) {
            setPhoneError(null);
          }
        }}
        error={phoneError}
      />

      <Pressable
        onPress={() => void handleDonate()}
        disabled={donationState !== "form"}
        className="mt-6 rounded-xl bg-gray-950 px-4 py-3.5"
        style={({ pressed }) => ({
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text className="text-center font-bold text-white">
          Donate
        </Text>
      </Pressable>
    </>
  );

// ===================================================================================
  const renderWaiting = () => (
    <View className="items-center py-6">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-green-50">
        <Ionicons
          name="phone-portrait-outline"
          size={30}
          color="#16a34a"
        />
      </View>

      <Text className="mt-5 text-center text-xl font-bold text-gray-950">
        Check your phone
      </Text>

      <Text className="mt-2 text-center text-sm leading-5 text-gray-500">
        An M-Pesa payment prompt has been sent to{" "}
        {phone}. Approve it on your phone to complete your donation.
      </Text>

      <View className="mt-6 flex-row items-center">
        <ActivityIndicator size="small" />

        <Text className="ml-2 text-sm text-gray-500">
          Confirming payment...
        </Text>
      </View>
    </View>
  );

  // ===================================================================================
  const renderSuccessful = () => (
    <View className="items-center py-6">
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
        Your donation of KES {amount} was received successfully.
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
  );

  // ===================================================================================
  const renderFailed = () => (
    <View className="items-center py-6">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <Ionicons
          name="close-circle-outline"
          size={42}
          color="#dc2626"
        />
      </View>

      <Text className="mt-5 text-center text-xl font-bold text-gray-950">
        Donation not completed
      </Text>

      <Text className="mt-2 text-center text-sm leading-5 text-gray-500">
        {errorMessage || "Something went wrong with the payment."}
      </Text>

      <Pressable
        onPress={() => {
          setDonationState("form");
          setErrorMessage(null);
        }}
        className="mt-6 w-full rounded-xl bg-gray-950 px-4 py-3.5"
      >
        <Text className="text-center font-bold text-white">
          Try again
        </Text>
      </Pressable>
    </View>
  );

// ===================================================================================
  const renderRecovery = () => {
    if (!paymentId) {
      return null;
    }

    return (
      <TransactionRecovery
        paymentId={paymentId}
        onVerified={() => {
          setDonationState("successful");
        }}
        onCancel={() => {
          setDonationState("failed");
          setErrorMessage(
            "We could not confirm the payment.",
          );
        }}
      />
    );
  };



 // ===================================================================================
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 justify-center bg-black/50 px-5">
        <View className="max-h-[90%] rounded-3xl bg-white p-6">
          {donationState !== "initiating" &&
            donationState !== "waiting" &&
            donationState !== "recovery" ? (
            <Pressable
              onPress={handleClose}
              className="absolute right-4 top-4 z-10 h-9 w-9 items-center justify-center rounded-full bg-gray-100"
            >
              <Ionicons
                name="close"
                size={20}
                color="#6b7280"
              />
            </Pressable>
          ) : null}

          {donationState === "form" ? renderForm() : null}

          {donationState === "initiating" ? (
            <View className="items-center py-10">
              <ActivityIndicator size="large" />

              <Text className="mt-5 text-center text-lg font-bold text-gray-950">
                Sending payment request...
              </Text>

              <Text className="mt-2 text-center text-sm text-gray-500">
                Please wait.
              </Text>
            </View>
          ) : null}

          {donationState === "waiting" ? renderWaiting() : null}

          {donationState === "successful"
            ? renderSuccessful()
            : null}

          {donationState === "recovery" ? renderRecovery() : null}

          {donationState === "failed" ? renderFailed() : null}
        </View>
      </View>
    </Modal>
  );
}
