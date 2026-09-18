import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { deleteAccount } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";

export default function AccountScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete account",
      "This will permanently delete your account and associated data. This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete account",
          style: "destructive",
          onPress: async () => {
            try {
              // Only performs the deletion request.
              await deleteAccount();
  
              // These happen ONLY if deletion succeeded.
              await logout();
              router.replace("/register");
            } catch (error) {
              // Deletion failed.
              Alert.alert(
                "Deletion failed",
                error instanceof Error
                  ? error.message
                  : "We couldn't delete your account. Please try again.",
              );
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="p-5"
    >
      <Text className="mb-2 text-3xl font-bold text-gray-900">
        Account
      </Text>

      <Text className="mb-6 text-base text-gray-600">
        Manage your account and account-related settings.
      </Text>

      <View className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
        <Text className="mb-1 text-lg font-semibold text-gray-900">
          Account settings
        </Text>

        <Text className="text-sm leading-5 text-gray-600">
          Manage your account and personal information.
        </Text>
      </View>

      <View className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <Text className="mb-2 text-lg font-semibold text-red-900">
          Delete account
        </Text>

        <Text className="mb-4 text-sm leading-5 text-red-800">
          Permanently delete your account and associated data. This action
          cannot be undone.
        </Text>

        <TouchableOpacity
          onPress={handleDeleteAccount}
          className="rounded-xl bg-red-600 px-4 py-3"
          activeOpacity={0.8}
        >
          <Text className="text-center font-semibold text-white">
            Delete my account
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}