
import { useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import PhoneNumberField from "@/components/marketplace/PhoneNumberField";
import { categories, MarketplaceCategory } from "@/types/marketplace";

export type WantedPostFormSubmitData = {
  title: string;
  description: string;
  category: MarketplaceCategory;
  budget: string;
  phone: string;
};

type WantedPostFormProps = {
  initialTitle?: string;
  initialDescription?: string;
  initialCategory?: MarketplaceCategory;
  initialBudget?: string;
  initialPhone?: string;
  submitLabel?: string;
  submittingLabel?: string;
  isSubmitting?: boolean;
  onSubmit: (data: WantedPostFormSubmitData) => Promise<void>;
};

export default function WantedPostForm({
  initialTitle = "",
  initialDescription = "",
  initialCategory,
  initialBudget = "",
  initialPhone = "",
  submitLabel = "Submit request",
  submittingLabel = "Submitting request...",
  isSubmitting = false,
  onSubmit,
}: WantedPostFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [category, setCategory] = useState<MarketplaceCategory | "">(
    initialCategory ?? "",
  );
  const [budget, setBudget] = useState(initialBudget);
  const [phone, setPhone] = useState(initialPhone);

  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setPhoneError(null);

    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }

    if (!description.trim()) {
      setError("Please enter a description.");
      return;
    }

    if (!category) {
      setError("Please select a category.");
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        budget: budget.trim(),
        phone: phone.trim(),
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to submit wanted post.",
      );
    }
  };

  return (
    <View className="gap-5">
      {/* Title */}
      <View>
        <Text className="mb-2 text-sm font-semibold text-gray-800">
          What are you looking for?
        </Text>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Samsung A15 128GB"
          placeholderTextColor="#9ca3af"
          className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-base text-gray-950"
        />
      </View>

      {/* Description */}
      <View>
        <Text className="mb-2 text-sm font-semibold text-gray-800">
          Description
        </Text>

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Describe what you are looking for..."
          placeholderTextColor="#9ca3af"
          multiline
          textAlignVertical="top"
          className="min-h-32 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-base text-gray-950"
        />
      </View>

      {/* Category */}
      <View>
        <Text className="mb-2 text-sm font-semibold text-gray-800">
          Category
        </Text>

        <Pressable
          onPress={() => setIsCategoryOpen(true)}
          className="rounded-2xl border border-gray-200 bg-white px-4 py-4"
        >
          <Text
            className={
              category
                ? "text-base text-gray-950"
                : "text-base text-gray-400"
            }
          >
            {category || "Select a category"}
          </Text>
        </Pressable>
      </View>

      {/* Budget */}
      <View>
        <Text className="mb-2 text-sm font-semibold text-gray-800">
          Budget
        </Text>

        <TextInput
          value={budget}
          onChangeText={setBudget}
          placeholder="e.g. 15000"
          placeholderTextColor="#9ca3af"
          keyboardType="decimal-pad"
          className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-base text-gray-950"
        />

        <Text className="mt-2 text-sm text-gray-500">
          Optional
        </Text>
      </View>

      {/* Phone */}
      <PhoneNumberField
        value={phone}
        onChange={setPhone}
        hasStoredNumber={Boolean(initialPhone)}
        error={phoneError}
      />

      {/* Error + Submit */}
      <View>
        {error && (
          <Text className="text-sm font-medium text-red-500">
            {error}
          </Text>
        )}

        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          className="mt-3 rounded-2xl bg-gray-950 p-4"
          style={({ pressed }) => ({
            opacity: pressed || isSubmitting ? 0.7 : 1,
          })}
        >
          <Text className="text-center text-base font-bold text-white">
            {isSubmitting ? submittingLabel : submitLabel}
          </Text>
        </Pressable>
      </View>

      {/* Category Modal */}
      <Modal
        visible={isCategoryOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCategoryOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setIsCategoryOpen(false)}
        >
          <Pressable
            className="rounded-t-3xl bg-white p-5"
            onPress={(event) => event.stopPropagation()}
          >
            <Text className="mb-4 text-xl font-bold text-gray-950">
              Select category
            </Text>

            {categories.map((item) => (
              <Pressable
                key={item}
                onPress={() => {
                  setCategory(item);
                  setIsCategoryOpen(false);
                }}
                className="border-b border-gray-100 py-4"
              >
                <Text className="text-base text-gray-900">
                  {item}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
