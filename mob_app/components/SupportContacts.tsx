import { Alert, Linking, Pressable, Text, View } from "react-native";
import { buildCallUrl, buildWhatsAppUrl } from "@/utils/phone";

interface Props {
  compact?: boolean;
}

const SUPPORT_PHONE = process.env.EXPO_PUBLIC_SUPPORT_PHONE;

export default function SupportContacts({ compact = false }: Props) {
  if (!SUPPORT_PHONE) {
    return null;
  }

  const message = "Hi, I need support with Agentic Campus Services.";

  const open = async (url: string, failMessage: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Can't open", failMessage);
    }
  };

  if (compact) {
    return (
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={() =>
            open(
              buildWhatsAppUrl(SUPPORT_PHONE, message),
              "WhatsApp isn't available on this device.",
            )
          }
          className="rounded-xl border border-gray-200 bg-white px-4 py-3"
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text className="text-sm font-semibold text-gray-700">
            WhatsApp-Support
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            open(
              buildCallUrl(SUPPORT_PHONE),
              "Calling isn't supported on this device.",
            )
          }
          className="rounded-xl border border-gray-200 bg-white px-4 py-3"
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text className="text-sm font-semibold text-gray-700">
            Call
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="mt-8 gap-3">
      <Text className="mb-1 text-lg font-bold text-gray-950">
        Need help?
      </Text>

      <Text className="mb-2 text-sm leading-5 text-gray-500">
        Contact our support team through WhatsApp or a phone call.
      </Text>

      <Pressable
        onPress={() =>
          open(
            buildWhatsAppUrl(SUPPORT_PHONE, message),
            "WhatsApp isn't available on this device.",
          )
        }
        className="rounded-2xl bg-green-600 py-4"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <Text className="text-center text-base font-bold text-white">
          Message Support on WhatsApp
        </Text>
      </Pressable>

      <Pressable
        onPress={() =>
          open(
            buildCallUrl(SUPPORT_PHONE),
            "Calling isn't supported on this device.",
          )
        }
        className="rounded-2xl border-2 border-gray-950 py-4"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <Text className="text-center text-base font-bold text-gray-950">
          Call Support
        </Text>
      </Pressable>
    </View>
  );
}
