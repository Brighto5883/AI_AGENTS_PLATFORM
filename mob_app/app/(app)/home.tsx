
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import DonationModal from "@/components/payments/DonationModal";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";

import FeedbackButton from "@/components/feedback/feedbackButton";
import FeedbackModal from "@/components/feedback/FeedbackModal";
import ServiceCard from "@/components/ServiceCard";
import { services } from "@/config/services";
import { getMarketplaceBillingInfo } from "@/services/marketplaceService";
import type { MarketplaceBillingInfo } from "@/types/billing";
import MarketplaceBillingNotice from "@/components/marketplace/MarketplaceBillingNotice";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { logout } = useAuth();
  const { width } = useWindowDimensions();
  const [donationVisible, setDonationVisible] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [billingInfo, setBillingInfo] = useState<MarketplaceBillingInfo | null>(null);

  // Responsive service grid:
  // Mobile  -> 2 columns
  // Tablet  -> 3 columns
  // Desktop -> 4 columns
  const serviceColumns =
    width >= 1200 ? 4 :
    width >= 800 ? 3 :
    2;

  const horizontalPadding =
    width >= 1200 ? 48 :
    width >= 800 ? 32 :
    20;

  const cardGap = width >= 800 ? 16 : 12;

  const contentWidth = width - horizontalPadding * 2;

  useEffect(() => {
    void getMarketplaceBillingInfo().then(setBillingInfo).catch(() => undefined);
  }, []);

  const cardWidth =
    (contentWidth - cardGap * (serviceColumns - 1)) /
    serviceColumns;

  return (
    <View className="flex-1 bg-homepage">
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-10 pt-12"
        showsVerticalScrollIndicator={false}
      >
        <View
          className="w-full"
          style={{
            paddingHorizontal: horizontalPadding,
          }}
        >
          {/* Header */}
          <View className="mb-7">
            <Text className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Agentic Campus Services
            </Text>

            <Text
              className={`mt-2 font-bold tracking-tight text-gray-950 ${
                width >= 1200
                  ? "text-5xl"
                  : width >= 800
                    ? "text-4xl"
                    : "text-3xl"
              }`}
            >
              Your workspace
            </Text>

            <Text
              className={`mt-2 leading-5 text-gray-500 ${
                width >= 800 ? "max-w-2xl text-base" : "text-sm"
              }`}
            >
              AI-powered tools and services for getting things done.
            </Text>
          </View>

          {billingInfo ? (
            <View className="mb-6">
              <MarketplaceBillingNotice billing={billingInfo} />
            </View>
          ) : null}

          {/* Services */}
          <View
            className="flex-row flex-wrap"
            style={{
              gap: cardGap,
            }}
          >
            {services.map((service) => (
              <View
                key={service.id}
                style={{
                  width: cardWidth,
                }}
              >
                <ServiceCard service={service} />
              </View>
            ))}
          </View>

          {/* Support the platform */}
          <Pressable
            onPress={() => setDonationVisible(true)}
            className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white p-5"
            style={({ pressed }) => ({
              opacity: pressed ? 0.82 : 1,
            })}
          >
            <View className="flex-row items-center">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-amber-50">
                <Ionicons
                  name="heart-outline"
                  size={23}
                  color="#d97706"
                />
              </View>

              <View className="ml-3 flex-1">
                <Text className="text-base font-bold text-gray-950">
                  Donate - Support the platform
                </Text>

                <Text className="mt-1 text-xs leading-4 text-gray-500">
                  Help us keep building useful AI-powered services for the KU community.
                </Text>
              </View>

              <Ionicons
                name="arrow-forward"
                size={18}
                color="#6b7280"
              />
            </View>
          </Pressable>

          <DonationModal
            visible={donationVisible}
            onClose={() => setDonationVisible(false)}
          />

          {/* Feedback */}
          <View className="mt-4 items-end">
            <FeedbackButton
              onPress={() => setFeedbackVisible(true)}
            />
          </View>

          <FeedbackModal
            visible={feedbackVisible}
            onClose={() => setFeedbackVisible(false)}
            screen="home"
          />

          {/* Logout */}
          <Pressable
            onPress={logout}
            className="mt-7 flex-row items-center justify-center rounded-2xl border border-gray-200 bg-white p-3.5"
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons
              name="log-out-outline"
              size={19}
              color="#6b7280"
            />

            <Text className="ml-2 text-sm font-semibold text-gray-600">
              Log out
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
