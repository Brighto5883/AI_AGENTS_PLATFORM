
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
      className={`min-h-[190px] rounded-3xl border p-4 ${
        available
          ? "border-gray-200 bg-white"
          : "border-gray-200 bg-gray-100"
      }`}
    >
      {/* Header */}
      <View className="flex-row items-start justify-between">
        {/* Service icon */}
        <View
          className="h-12 w-12 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: available
              ? service.iconBackgroundColor
              : "#e5e7eb",
          }}
        >
          <Ionicons
            name={service.icon}
            size={24}
            color={
              available
                ? service.iconColor
                : "#9ca3af"
            }
          />
        </View>

        {/* Availability badge */}
        <View
          className={`rounded-full px-2.5 py-1 ${
            available
              ? "bg-green-50"
              : "bg-gray-200"
          }`}
        >
          <View className="flex-row items-center">
            <View
              className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                available
                  ? "bg-green-500"
                  : "bg-gray-400"
              }`}
            />

            <Text
              className={`text-[10px] font-bold uppercase tracking-wide ${
                available
                  ? "text-green-700"
                  : "text-gray-500"
              }`}
            >
              {available
                ? "Available"
                : "Coming soon"}
            </Text>
          </View>
        </View>
      </View>

      {/* Service information */}
      <View className="mt-4 flex-1">
        <Text
          numberOfLines={2}
          className={`text-base font-bold leading-5 ${
            available
              ? "text-gray-950"
              : "text-gray-500"
          }`}
        >
          {service.name}
        </Text>

        <Text
          numberOfLines={3}
          className={`mt-1.5 text-xs leading-4 ${
            available
              ? "text-gray-500"
              : "text-gray-400"
          }`}
        >
          {service.description}
        </Text>
      </View>

      {/* Action / availability information */}
      {available ? (
        <View className="mt-4 flex-row items-center">
          <View className="flex-row items-center rounded-xl bg-gray-950 px-3 py-2">
            <Text className="mr-1.5 text-xs font-bold text-white">
              Open
            </Text>

            <Ionicons
              name="arrow-forward"
              size={14}
              color="white"
            />
          </View>
        </View>
      ) : (
        <View className="mt-4 flex-row items-center">
          <Ionicons
            name="time-outline"
            size={14}
            color="#9ca3af"
          />

          <Text className="ml-1.5 text-xs font-medium text-gray-400">
            Currently unavailable
          </Text>
        </View>
      )}
    </View>
  );

  if (!available) {
    return (
      <View className="mb-3">
        {card}
      </View>
    );
  }

  return (
    <Link href={service.path as never} asChild>
      <Pressable
        className="mb-3"
        style={({ pressed }) => ({
          opacity: pressed ? 0.82 : 1,
          transform: [
            {
              scale: pressed ? 0.985 : 1,
            },
          ],
        })}
      >
        {card}
      </Pressable>
    </Link>
  );
}
