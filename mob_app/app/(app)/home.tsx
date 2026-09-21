import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import DonationModal from "@/components/payments/DonationModal";
import FeedbackButton from "@/components/feedback/feedbackButton";
import FeedbackModal from "@/components/feedback/FeedbackModal";
import SupportContacts from "@/components/SupportContacts";
import ServiceCard from "@/components/ServiceCard";
import MarketplaceBillingNotice from "@/components/marketplace/MarketplaceBillingNotice";

import { services } from "@/config/services";
import { getMarketplaceBillingInfo } from "@/services/marketplaceService";
import { useAuth } from "@/context/AuthContext";

import type { MarketplaceBillingInfo } from "@/types/billing";

export default function Home() {
  const { logout } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [donationVisible, setDonationVisible] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [billingInfo, setBillingInfo] =
    useState<MarketplaceBillingInfo | null>(null);

  /*
   * Responsive service grid
   *
   * Mobile  -> 2 columns
   * Tablet  -> 3 columns
   * Desktop -> 4 columns
   */
  const serviceColumns =
    width >= 1200
      ? 4
      : width >= 800
        ? 3
        : 2;

  const horizontalPadding =
    width >= 1200
      ? 48
      : width >= 800
        ? 32
        : 20;

  const cardGap = width >= 800 ? 16 : 12;

  const contentWidth = width - horizontalPadding * 2;

  const cardWidth =
    (contentWidth - cardGap * (serviceColumns - 1)) /
    serviceColumns;

  /*
   * Load marketplace billing information
   */
  useEffect(() => {
    void getMarketplaceBillingInfo()
      .then(setBillingInfo)
      .catch(() => undefined);
  }, []);

  return (
    <View className="flex-1 bg-homepage">
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-10 pt-5"
        showsVerticalScrollIndicator={false}
      >
        <View
          className="w-full"
          style={{
            paddingHorizontal: horizontalPadding,
          }}
        >
          {/* ========================================================= */}
          {/* HEADER */}
          {/* ========================================================= */}

          <View className="mb-6 flex-row items-center justify-between">
            {/* Brand */}
            <View className="flex-row items-center">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-gray-950">
                <Ionicons
                  name="sparkles"
                  size={17}
                  color="white"
                />
              </View>

              <Text className="ml-2.5 text-base font-bold tracking-tight text-gray-950">
                Campus Connect
              </Text>
            </View>

            {/* Account */}
            <Pressable
              onPress={() => router.push("/account")}
              className="flex-row items-center rounded-full border border-gray-200 bg-white px-3.5 py-2"
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
              })}
              accessibilityLabel="Account"
            >
              <Ionicons
                name="person-outline"
                size={18}
                color="#374151"
              />

              <Text className="ml-2 text-sm font-semibold text-gray-700">
                Account
              </Text>
            </Pressable>
          </View>

          {/* ========================================================= */}
          {/* HERO */}
          {/* ========================================================= */}

          {/* HERO */}
          <View className="mb-6">
            <Text className="text-xs font-bold uppercase tracking-widest text-gray-700">
              Your workspace
            </Text>

            <Text
              className={`mt-1.5 font-bold tracking-tight text-gray-950 ${
                width >= 1200
                  ? "text-5xl"
                  : width >= 800
                    ? "text-4xl"
                    : "text-3xl"
              }`}
            >
              Get things done.
            </Text>

            <Text
              className={`mt-2 leading-5 text-gray-700 ${
                width >= 800
                  ? "max-w-2xl text-base"
                  : "text-sm"
              }`}
            >
              AI-powered campus services, all in one place.
            </Text>
          </View>

          {/* ========================================================= */}
          {/* MARKETPLACE BILLING NOTICE */}
          {/* ========================================================= */}

          {/* {billingInfo ? (
            <View className="mb-6">
              <MarketplaceBillingNotice billing={billingInfo} />
            </View>
          ) : null} */}

          {/* ========================================================= */}
          {/* SERVICES */}
          {/* ========================================================= */}

          <View className="mb-3">
            <Text className="text-xl font-bold tracking-tight text-gray-950">
              Services
            </Text>
          </View>

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

          {/* ========================================================= */}
          {/* SUPPORT THE PLATFORM */}
          {/* ========================================================= */}

          <Pressable
            onPress={() => setDonationVisible(true)}
            className="mt-7 overflow-hidden rounded-3xl border border-gray-200 bg-white p-5"
            style={({ pressed }) => ({
              opacity: pressed ? 0.82 : 1,
            })}
          >
            <View className="flex-row items-center">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-amber-50">
                <Ionicons
                  name="heart-outline"
                  size={22}
                  color="#d97706"
                />
              </View>

              <View className="ml-3 flex-1">
                <Text className="text-base font-bold text-gray-950">
                  Support Campus Connect
                </Text>

                <Text className="mt-1 text-xs leading-4 text-gray-500">
                  Help us keep building useful services for the campus
                  community.
                </Text>
              </View>

              <View className="ml-3 h-9 w-9 items-center justify-center rounded-full bg-gray-50">
                <Ionicons
                  name="arrow-forward"
                  size={17}
                  color="#6b7280"
                />
              </View>
            </View>
          </Pressable>

          <DonationModal
            visible={donationVisible}
            onClose={() => setDonationVisible(false)}
          />

          {/* ========================================================= */}
          {/* SUPPORT + FEEDBACK */}
          {/* ========================================================= */}

          <View className="mt-5 flex-row items-center justify-center gap-2">
            <SupportContacts compact />

            <FeedbackButton
              onPress={() => setFeedbackVisible(true)}
            />
          </View>

          <FeedbackModal
            visible={feedbackVisible}
            onClose={() => setFeedbackVisible(false)}
            screen="home"
          />

          {/* ========================================================= */}
          {/* LOG OUT */}
          {/* ========================================================= */}

          <Pressable
            onPress={logout}
            className="mt-4 flex-row items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3.5"
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
            })}
            accessibilityLabel="Log out"
          >
            <Ionicons
              name="log-out-outline"
              size={18}
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