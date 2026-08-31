import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, View } from "react-native";

import ServiceCard from "@/components/ServiceCard";
import { services } from "@/config/services";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { logout } = useAuth();

  return (
    <View className="flex-1 bg-homepage">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-16"
        showsVerticalScrollIndicator={true}
      >
        {/* Header */}
        <View className="mb-8">
          <Text className="mb-2 text-sm font-semibold uppercase tracking-widest text-gray-500">
            AI Agents Platform
          </Text>

          <Text className="text-4xl font-bold tracking-tight text-gray-950">
            Your workspace
          </Text>

          <Text className="mt-3 max-w-md text-base leading-6 text-gray-500">
            Choose an AI agent or service to get started.
          </Text>
        </View>

        {/* Services */}
        <View>
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
            />
          ))}
        </View>

        {/* Logout */}
        <Pressable
          onPress={logout}
          className="mt-5 flex-row items-center justify-center rounded-2xl border border-gray-200 bg-white p-4"
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color="#6b7280"
          />

          <Text className="ml-2 font-semibold text-gray-600">
            Log out
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}