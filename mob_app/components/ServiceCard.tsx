import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

import type { Service } from "@/config/services";

type ServiceCardProps = {
  service: Service;
};

export default function ServiceCard({
  service,
}: ServiceCardProps) {
  const available = service.status === "available";

  const card = (
    <View
      className={`rounded-3xl border p-5 ${
        available
          ? "border-gray-200 bg-white"
          : "border-gray-200 bg-gray-100"
      }`}
    >
      {/* Icon + status */}
      <View className="mb-5 flex-row items-center justify-between">
        <View
          className={`h-14 w-14 items-center justify-center rounded-2xl ${
            available ? "bg-gray-900" : "bg-gray-300"
          }`}
        >
          <Ionicons
            name={service.icon as keyof typeof Ionicons.glyphMap}
            size={27}
            color={available ? "white" : "#6b7280"}
          />
        </View>

        {!available && (
          <View className="rounded-full bg-gray-200 px-3 py-1.5">
            <Text className="text-xs font-semibold text-gray-500">
              Coming soon
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <Text
        className={`mb-2 text-xl font-bold ${
          available ? "text-gray-900" : "text-gray-500"
        }`}
      >
        {service.name}
      </Text>

      <Text
        className={`text-sm leading-5 ${
          available ? "text-gray-500" : "text-gray-400"
        }`}
      >
        {service.description}
      </Text>

      {/* Action indicator */}
      {available && (
        <View className="mt-5 flex-row items-center">
          <Text className="mr-2 text-sm font-semibold text-gray-900">
            Open
          </Text>

          <Ionicons
            name="arrow-forward"
            size={16}
            color="#111827"
          />
        </View>
      )}
    </View>
  );

  if (!available) {
    return (
      <View className="mb-4 opacity-80">
        {card}
      </View>
    );
  }

  return (
    <Link href={service.path as never} asChild>
      <Pressable
        className="mb-4"
        style={({ pressed }) => ({
          opacity: pressed ? 0.75 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        {card}
      </Pressable>
    </Link>
  );
}