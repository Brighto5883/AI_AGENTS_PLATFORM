import { Alert, Modal, Platform, Pressable,
          ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { deleteAccount } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";
import { useState } from 'react';

export default function AccountScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionSuccessVisible, setDeletionSuccessVisible] = useState(false);

  const performDeleteAccount = async () => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);

      await deleteAccount();

      setDeleteModalVisible(false);
      setDeletionSuccessVisible(true);

      await new Promise((resolve) => setTimeout(resolve, 3000));

      setDeletionSuccessVisible(false);
      await logout();
      // Do not call router.replace("/register") here.
      // The authenticated app layout will redirect to /login
      // when logout clears the authentication state.
    } catch (error) {
      if (Platform.OS === "web") {
        window.alert(
          error instanceof Error
            ? error.message
            : "We couldn't delete your account. Please try again.",
        );
      } else {
        Alert.alert(
          "Deletion failed",
          error instanceof Error
            ? error.message
            : "We couldn't delete your account. Please try again.",
        );
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAccount = () => {
    if (Platform.OS === "web") {
      setDeleteModalVisible(true);
      return;
    }

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
          onPress: performDeleteAccount,
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

        <Modal
          visible={deleteModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (!isDeleting) {
              setDeleteModalVisible(false);
            }
          }}
        >
          <View className="flex-1 items-center justify-center bg-black/50 px-5">
            <View className="w-full max-w-md rounded-3xl bg-white p-6">
              <Text className="text-xl font-bold text-gray-950">
                Delete account?
              </Text>

              <Text className="mt-3 text-sm leading-6 text-gray-600">
                This will permanently delete your account and associated data.
                This action cannot be undone.
              </Text>

              <View className="mt-6 flex-row justify-end gap-3">
                <Pressable
                  disabled={isDeleting}
                  onPress={() => setDeleteModalVisible(false)}
                  className="rounded-xl border border-gray-200 px-5 py-3"
                >
                  <Text className="font-semibold text-gray-700">
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  disabled={isDeleting}
                  onPress={performDeleteAccount}
                  className={`rounded-xl px-5 py-3 ${
                    isDeleting ? "bg-red-300" : "bg-red-600"
                  }`}
                >
                  <Text className="font-semibold text-white">
                    {isDeleting ? "Deleting..." : "Delete account"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={deletionSuccessVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {}}
        >
          <View className="flex-1 items-center justify-center bg-black/50 px-6">
            <View className="w-full max-w-md rounded-2xl bg-white p-6">
              <Text className="mb-2 text-center text-xl font-bold text-gray-900">
                Account deleted
              </Text>

              <Text className="text-center text-gray-600">
                Your account and associated data have been successfully deleted.
                You will be redirected to the login page shortly.
              </Text>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}