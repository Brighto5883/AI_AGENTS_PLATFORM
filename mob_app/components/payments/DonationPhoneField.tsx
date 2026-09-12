
import { Text, TextInput, View } from "react-native";

interface DonationPhoneFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
}

export default function DonationPhoneField({
  value,
  onChange,
  error,
}: DonationPhoneFieldProps) {
  return (
    <View className="mt-5">
      <Text className="text-sm font-semibold text-gray-700">
        M-Pesa phone number
      </Text>

      <TextInput
        value={value}
        onChangeText={onChange}
        editable
        placeholder="e.g. 0712345678"
        placeholderTextColor="#9ca3af"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        autoCorrect={false}
        className={`mt-2 rounded-xl border px-4 py-3 ${
          error
            ? "border-red-300 bg-red-50 text-gray-900"
            : "border-gray-200 bg-white text-gray-900"
        }`}
      />

      <Text className="mt-1 text-xs text-gray-400">
        This number will receive the M-Pesa payment prompt. Enter your pin to complete 
        payment.
      </Text>

      {error ? (
        <Text className="mt-1 text-xs text-red-500">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

