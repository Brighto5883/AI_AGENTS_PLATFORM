import { View } from "react-native";
import WhatsAppCard from "@/components/WhatsAppCard";

export default function WhatsAppAgent() {
  return (
    <View className="flex-1 bg-whatsapp p-6">
      <WhatsAppCard />
    </View>
  );
}