import { Pressable, Text, View } from "react-native";
import type { WantedPost } from "@/types/marketplace";

interface Props {
  wantedPost: WantedPost;
  onPress: () => void;
}

export default function WantedPostCard({ wantedPost, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-2xl border border-gray-200 bg-white p-4"
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
    >
      <View className="flex-row items-start justify-between">
        <Text
          className="flex-1 text-base font-bold text-gray-950"
          numberOfLines={1}
        >
          {wantedPost.title}
        </Text>

        <View className="ml-2 rounded-full bg-gray-100 px-3 py-1">
          <Text className="text-xs font-semibold text-gray-600">
            {wantedPost.category}
          </Text>
        </View>
      </View>

      <Text className="mt-1.5 text-sm text-gray-500" numberOfLines={2}>
        {wantedPost.description}
      </Text>

      <Text className="mt-2 text-sm font-semibold text-gray-950">
        {wantedPost.budget ? `Budget: KSh ${wantedPost.budget}` : "No budget set"}
      </Text>
    </Pressable>
  );
}