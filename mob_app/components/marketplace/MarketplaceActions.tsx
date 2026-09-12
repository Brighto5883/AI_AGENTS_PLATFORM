
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Pressable,
  Text,
  View,
} from "react-native";

type MarketplaceAction = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
  path: string;
};

const actions: MarketplaceAction[] = [
  {
    title: "Sell something",
    description: "List an item for the KU community.",
    icon: "pricetag-outline",
    iconColor: "#2563eb",
    iconBackground: "#dbeafe",
    path: "/marketplace/listings/create-listing",
  },
  {
    title: "Find something",
    description: "Browse what people are looking for.",
    icon: "search-outline",
    iconColor: "#16a34a",
    iconBackground: "#dcfce7",
    path: "/marketplace/wanted",
  },
  {
    title: "Post a request",
    description: "Tell the community what you need.",
    icon: "create-outline",
    iconColor: "#9333ea",
    iconBackground: "#f3e8ff",
    path: "/marketplace/wanted/create-wanted",
  },
  {
    title: "My Marketplace",
    description: "Manage your listings and requests.",
    icon: "person-outline",
    iconColor: "#ea580c",
    iconBackground: "#ffedd5",
    path: "/marketplace/my-marketplace",
  },
];

export default function MarketplaceActions() {
  return (
    <View className="mt-7">
      <Text className="text-lg font-bold text-gray-950">
        What would you like to do?
      </Text>

      <Text className="mt-1 text-sm text-gray-500">
        Quickly access the marketplace tools you need.
      </Text>

      <View className="mt-4 flex-row flex-wrap gap-3">
        {actions.map((action) => (
          <Pressable
            key={action.title}
            onPress={() =>
              router.push(action.path as never)
            }
            className="min-h-[118px] rounded-2xl border border-gray-200 bg-white p-4"
            style={({ pressed }) => ({
              width: "48%",
              opacity: pressed ? 0.8 : 1,
              transform: [
                {
                  scale: pressed ? 0.985 : 1,
                },
              ],
            })}
          >
            <View
              className="h-10 w-10 items-center justify-center rounded-xl"
              style={{
                backgroundColor:
                  action.iconBackground,
              }}
            >
              <Ionicons
                name={action.icon}
                size={20}
                color={action.iconColor}
              />
            </View>

            <Text className="mt-3 text-sm font-bold text-gray-950">
              {action.title}
            </Text>

            <Text
              numberOfLines={2}
              className="mt-1 text-xs leading-4 text-gray-500"
            >
              {action.description}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
