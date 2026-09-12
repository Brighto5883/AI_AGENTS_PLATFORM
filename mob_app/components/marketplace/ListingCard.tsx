
import { Image, Pressable, Text, View } from "react-native";

import type { Listing } from "@/types/marketplace";

type ListingCardProps = {
  listing: Listing;
  onPress?: () => void;
};

export default function ListingCard({
  listing,
  onPress,
}: ListingCardProps) {
  const imageUrl = listing.images[0]?.url;

  return (
    <Pressable
      onPress={onPress}
      className="mb-4 overflow-hidden rounded-2xl bg-white"
      style={({ pressed }) => ({
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {imageUrl ? (
        <View
          className="w-full items-center justify-center bg-gray-100"
          style={{
            aspectRatio: 1,
          }}
        >
          <Image
            source={{ uri: imageUrl }}
            className="h-full w-full"
            resizeMode="contain"
          />
        </View>
      ) : (
        <View
          className="w-full items-center justify-center bg-gray-100"
          style={{
            aspectRatio: 1,
          }}
        >
          <Text className="text-gray-400">
            No image
          </Text>
        </View>
      )}

      <View className="p-4">
        <Text
          numberOfLines={2}
          className="text-base font-bold text-gray-950"
        >
          {listing.title}
        </Text>

        <Text
          numberOfLines={1}
          className="mt-1 text-sm text-gray-500"
        >
          {listing.category}
        </Text>

        <Text className="mt-2 text-lg font-bold text-gray-950">
          KSh {listing.price}
        </Text>
      </View>
    </Pressable>
  );
}