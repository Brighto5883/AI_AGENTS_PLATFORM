import { useEffect, useState } from "react";
import { Switch, Text, TextInput, View } from "react-native";

interface PhoneNumberFieldProps {
  value: string;
  onChange: (value: string) => void;
  hasStoredNumber: boolean;
  error?: string | null;
}

export default function PhoneNumberField({
  value,
  onChange,
  hasStoredNumber,
  error,
}: PhoneNumberFieldProps) {
  // If there is no stored number, the user must be able to enter one.
  // If there is a stored number, editing starts disabled.
  const [editingEnabled, setEditingEnabled] = useState(!hasStoredNumber);

  // Keep the edit state synchronized if hasStoredNumber changes later,
  // for example after the user's profile finishes loading.
  useEffect(() => {
    setEditingEnabled(!hasStoredNumber);
  }, [hasStoredNumber]);

  const handleEditToggle = (enabled: boolean) => {
    setEditingEnabled(enabled);
  };

  return (
    <View className="mt-5">
      {/* Label + Edit toggle */}
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-gray-700">
          WhatsApp number
        </Text>

        {hasStoredNumber && (
          <View className="flex-row items-center">
            <Text className="mr-2 text-xs text-gray-500">
              Edit
            </Text>

            <Switch
              value={editingEnabled}
              onValueChange={handleEditToggle}
              accessibilityLabel="Enable editing of WhatsApp number"
            />
          </View>
        )}
      </View>

      {/* Phone number input */}
      <TextInput
        value={value}
        onChangeText={onChange}
        editable={editingEnabled}
        placeholder="e.g. 0712345678"
        placeholderTextColor="#9ca3af"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        autoCorrect={false}
        className={`mt-2 rounded-xl border px-4 py-3 ${
          editingEnabled
            ? "border-gray-200 bg-white text-gray-900"
            : "border-gray-200 bg-gray-100 text-gray-500"
        }`}
      />

      {/* Explanation */}
      <Text className="mt-1 text-xs text-gray-400">
        Used to reach you about this post and saved to your profile for next
        time.
      </Text>

      {/* Validation error */}
      {error ? (
        <Text className="mt-1 text-xs text-red-500">
          {error}
        </Text>
      ) : null}
    </View>
  );
}