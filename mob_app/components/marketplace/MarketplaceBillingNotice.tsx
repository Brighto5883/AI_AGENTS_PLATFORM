import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import type { MarketplaceBillingInfo } from "@/types/billing";

interface Props {
  billing: MarketplaceBillingInfo;
  onPress?: () => void;
}

function money(value: string | null, currency: string) {
  if (value === null) return null;
  return `${currency} ${value}`;
}

export default function MarketplaceBillingNotice({ billing, onPress }: Props) {
  const content = (
    <View className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
      <View className="flex-row items-start">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-white">
          <Ionicons name="information-circle-outline" size={22} color="#2563eb" />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-sm font-bold text-blue-950">{billing.notice_title}</Text>
          <Text className="mt-1 text-xs leading-5 text-blue-800">{billing.notice_message}</Text>
        </View>
      </View>

      <View className="mt-4 rounded-xl bg-white p-3">
        <Text className="text-xs font-bold uppercase tracking-wide text-gray-500">
          Planned marketplace charges
        </Text>
        {billing.plans.map((plan) => (
          <View key={plan.mode} className="mt-3">
            <Text className="text-sm font-bold text-gray-900">{plan.name}</Text>
            <Text className="mt-0.5 text-xs leading-4 text-gray-500">{plan.description}</Text>
            <View className="mt-1 flex-row flex-wrap gap-x-3 gap-y-1">
              {plan.monthly_fee && (
                <Text className="text-xs font-semibold text-gray-700">
                  {money(plan.monthly_fee, billing.currency)}/month
                </Text>
              )}
              {plan.listing_fee_per_item && (
                <Text className="text-xs font-semibold text-gray-700">
                  {money(plan.listing_fee_per_item, billing.currency)}/listing
                </Text>
              )}
              {plan.connection_fee && plan.connection_fee !== "0.00" && (
                <Text className="text-xs font-semibold text-gray-700">
                  {money(plan.connection_fee, billing.currency)}/connection
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      {content}
    </Pressable>
  );
}
