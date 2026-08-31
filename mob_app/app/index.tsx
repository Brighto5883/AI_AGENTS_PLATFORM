import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/home" />;
  }

  return <Redirect href="/login" />;
}