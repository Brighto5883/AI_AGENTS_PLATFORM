import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text } from "react-native";

interface FeedbackButtonProps {
  onPress: () => void;
  label?: string;
}

export default function FeedbackButton({
  onPress,
  label="Send feedback",
}: FeedbackButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center rounded-xl border border-gray-300 bg-white px-4 py-3"
      style={({ pressed }) => ({
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <Ionicons
        name="chatbubble-ellipses-outline"
        size={19}
        color="#374151"
      />

      <Text className="ml-2 font-semibold text-gray-700">
        {label}
      </Text>
    </Pressable>
  );
}