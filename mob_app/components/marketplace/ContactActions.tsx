import { Alert, Linking, Pressable, Text, View } from "react-native";
import { buildWhatsAppUrl, buildCallUrl, buildSmsUrl } from "@/utils/phone";

interface Props {
  phone: string | null;
  contactName?: string | null;
  contextLabel: string; // listing/wanted-post title, used in the pre-filled message
  isOwnPost: boolean;
  contactUnlocked?: boolean;
  onUnlockContact?: () => void;
  isUnlocking?: boolean;
}

export default function ContactActions({
  phone,
  contactName,
  contextLabel,
  isOwnPost,
  contactUnlocked = true,
  onUnlockContact,
  isUnlocking = false,
}: Props) {
  if (isOwnPost) {
    return null; // no point contacting yourself
  }

  if (!contactUnlocked) {
    return (
      <View className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <Text className="text-center text-sm font-semibold text-amber-900">
          Contact is locked.
        </Text>
  
        <Text className="mt-1 text-center text-xs leading-5 text-amber-800">
          Complete the connection payment to unlock this contact.
        </Text>
  
        {onUnlockContact && (
          <Pressable
            onPress={onUnlockContact}
            disabled={isUnlocking}
            className="mt-4 rounded-2xl bg-gray-950 py-4"
            style={({ pressed }) => ({
              opacity: pressed || isUnlocking ? 0.7 : 1,
            })}
          >
            <Text className="text-center text-base font-bold text-white">
              {isUnlocking ? "Starting payment..." : "Unlock Contact"}
            </Text>
          </Pressable>
        )}
      </View>
    );
  }

  if (!phone) {
    return (
      <View className="mt-8 rounded-2xl bg-gray-100 p-4">
        <Text className="text-center text-sm text-gray-500">
          {contactName ? `${contactName} hasn't` : "This user hasn't"} added a contact number yet.
        </Text>
      </View>
    );
  }

  const message = `Hi, I saw your post "${contextLabel}" on KU Marketplace.`;

  const open = async (url: string, failMessage: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Can't open", failMessage);
    }
  };

  return (
    <View className="mt-8 gap-3">
      <Pressable
        onPress={() => open(buildWhatsAppUrl(phone, message), "WhatsApp isn't available on this device.")}
        className="rounded-2xl bg-green-600 py-4"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <Text className="text-center text-base font-bold text-white">
          Message on WhatsApp
        </Text>
      </Pressable>

      <Pressable
        onPress={() => open(buildCallUrl(phone), "Calling isn't supported on this device.")}
        className="rounded-2xl border-2 border-gray-950 py-4"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <Text className="text-center text-base font-bold text-gray-950">
          Call {phone}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => open(buildSmsUrl(phone), "SMS isn't supported on this device.")}
        className="py-2"
      >
        <Text className="text-center text-sm font-semibold text-gray-500">
          Or send an SMS
        </Text>
      </Pressable>
    </View>
  );
}