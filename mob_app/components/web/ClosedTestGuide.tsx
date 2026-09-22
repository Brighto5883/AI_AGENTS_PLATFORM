import { Ionicons } from "@expo/vector-icons";
import { Image, Linking, Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useState } from "react";

const GOOGLE_GROUP_URL =
  "https://groups.google.com/u/1/g/campusketesters";
const PLAY_TEST_URL =
  "https://play.google.com/apps/testing/com.infinit3ke.agenticcampusservices";

const steps = [
  {
    number: "1",
    title: "Join the CampusKE Testers group",
    description:
      "Open the Google Group link, tap Join group at the top right, then tap Join group again on the confirmation page.",
    image: require("@/assets/images/closed-test/step-1-join-group.png"),
    buttonLabel: "Join Google Group",
    url: GOOGLE_GROUP_URL,
  },
  {
    number: "2",
    title: "Confirm your group membership",
    description:
      "On the Join CampusKE Testers page, leave the subscription settings as you prefer and tap Join group. A confirmation will appear when you have joined.",
    image: require("@/assets/images/closed-test/step-2-confirm-group.png"),
  },
  {
    number: "3",
    title: "Become an Android tester",
    description:
      "Open the Google Play testing link, scroll down and tap Become a tester. You should then see You are a tester.",
    image: require("@/assets/images/closed-test/step-3-become-tester.png"),
    buttonLabel: "Open Play Test",
    url: PLAY_TEST_URL,
  },
  {
    number: "4",
    title: "Download Bikven from Google Play",
    description:
      "After becoming a tester, tap the blue download it on Google Play link, then install Bikven from Google Play.",
    image: require("@/assets/images/closed-test/step-4-download.png"),
  },
];

export default function ClosedTestGuide({ compact = false }: { compact?: boolean }) {
  const [visible, setVisible] = useState(false);

  if (Platform.OS !== "web") {
    return null;
  }

  const openLink = (url: string) => {
    if (Platform.OS === "web") {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    void Linking.openURL(url);
  };

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        className={
          compact
            ? "rounded-full border border-gray-200 bg-white px-3 py-2"
            : "mb-1 flex-row items-center rounded-xl px-3 py-2.5"
        }
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        accessibilityRole="button"
        accessibilityLabel="How to join the Bikven Android test"
      >
        <Ionicons
          name="phone-portrait-outline"
          size={compact ? 16 : 18}
          color="#374151"
        />
        <Text className={compact ? "ml-1.5 text-sm font-semibold text-gray-700" : "ml-3 text-sm font-semibold text-gray-700"}>
          {compact ? "Android test" : "Join Android test"}
        </Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/60 px-4 py-6">
          <View
            className="w-full max-w-3xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl"
            style={{ maxHeight: "92%" }}
          >
            <View className="flex-row items-start justify-between border-b border-gray-200 px-5 py-4">
              <View className="mr-4 flex-1">
                <View className="flex-row items-center">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-gray-950">
                    <Ionicons name="phone-portrait-outline" size={20} color="#ffffff" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-xl font-bold text-gray-950">
                      Join the Bikven Android test
                    </Text>
                    <Text className="mt-1 text-sm leading-5 text-gray-500">
                      Follow these four steps to join the tester group, install the app and start testing.
                    </Text>
                  </View>
                </View>
              </View>

              <Pressable
                onPress={() => setVisible(false)}
                className="h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-50"
                accessibilityRole="button"
                accessibilityLabel="Close testing guide"
              >
                <Ionicons name="close" size={20} color="#6b7280" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator
              contentContainerClassName="px-5 pb-7 pt-5"
            >
              <View className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <Text className="text-sm font-bold text-blue-950">
                  Before you start
                </Text>
                <Text className="mt-1 text-sm leading-5 text-blue-900">
                  Use the same Google account in Google Groups and Google Play. After installation, the latest interface updates may arrive shortly after the app connects to the internet. If needed, close and reopen Bikven.
                </Text>
              </View>

              {steps.map((step, index) => (
                <View
                  key={step.number}
                  className={index === steps.length - 1 ? "" : "mb-7"}
                >
                  <View className="flex-row items-start">
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-gray-950">
                      <Text className="font-bold text-white">{step.number}</Text>
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-base font-bold text-gray-950">
                        {step.title}
                      </Text>
                      <Text className="mt-1 text-sm leading-5 text-gray-500">
                        {step.description}
                      </Text>
                    </View>
                  </View>

                  <View className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                    <Image
                      source={step.image}
                      accessibilityLabel={`Bikven testing guide step ${step.number}`}
                      resizeMode="contain"
                      style={{
                        width: "100%",
                        height: 420,
                      }}
                    />
                  </View>

                  {step.buttonLabel && step.url ? (
                    <Pressable
                      onPress={() => openLink(step.url)}
                      className="mt-3 flex-row items-center justify-center rounded-xl bg-gray-950 px-4 py-3"
                      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                    >
                      <Ionicons name="open-outline" size={17} color="#ffffff" />
                      <Text className="ml-2 font-bold text-white">
                        {step.buttonLabel}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}

              <View className="mt-1 rounded-2xl border border-gray-200 bg-white p-4">
                <Text className="text-sm font-bold text-gray-950">
                  Start testing 🚀
                </Text>
                <Text className="mt-1 text-sm leading-5 text-gray-500">
                  Register, log in, explore the marketplace and try the features you need. If you find a problem, use the Feedback option or the contact links inside Bikven.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
