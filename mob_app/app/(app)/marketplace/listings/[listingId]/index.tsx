import { useTransientError } from "@/hooks/useTransientError";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { deleteListing, getListing } from "@/services/marketplaceService";
import { useAuth } from "@/context/AuthContext";
import ContactActions from "@/components/marketplace/ContactActions";
import FeedbackButton from "@/components/feedback/feedbackButton";
import FeedbackModal from "@/components/feedback/FeedbackModal";
import MarketplacePaymentModal from "@/components/marketplace/MarketplacePaymentModal";
import { createListingConnection } from "@/services/marketplaceTransactionService";
import type { Listing, Transaction } from "@/types/marketplace";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";



export default function ListingDetails() {
  const { listingId } = useLocalSearchParams<{
    listingId: string;
  }>();
  const { user } = useAuth();

  const { width } = useWindowDimensions();

  const isDesktop = width >= 900;

  const [isDeleting, setIsDeleting] = useState(false);
  const [listing, setListing] = useState<Listing | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useTransientError();
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [connectionTransaction, setConnectionTransaction] =
  useState<Transaction | null>(null);
 // ---------------------------------------------------------------------------------
  const imageListRef =
    useRef<FlatList<Listing["images"][number]>>(null);

 // ---------------------------------------------------------------------------------
  const loadListing = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getListing(listingId);

        setListing(data);
        setSelectedImageIndex(0);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load listing.",
        );
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    void loadListing();

  }, [listingId]);

// ---------------------------------------------------------------------------------
  useEffect(() => {
    if (Platform.OS !== "web" || !isImageViewerOpen) {
      return;
    }

    window.history.pushState(
      { imageViewer: true },
      "",
      window.location.href,
    );

    const handlePopState = () => {
      setIsImageViewerOpen(false);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isImageViewerOpen]);

// ---------------------------------------------------------------------------------
  const handleUnlockContact = async () => {
    if (!listing || isUnlocking) {
      return;
    }

    if (!user?.phone) {
      Alert.alert(
        "Phone number required",
        "Add your phone number to your account before making a connection payment.",
      );
      return;
    }

    try {
      setIsUnlocking(true);
      setError(null);

      const transaction = await createListingConnection(
        listing.id,
      );

      setConnectionTransaction(transaction);
      setPaymentModalVisible(true);
    } catch (error) {
      Alert.alert(
        "Unable to continue",
        error instanceof Error
          ? error.message
          : "Failed to create the connection.",
      );
    } finally {
      setIsUnlocking(false);
    }
  };

// ---------------------------------------------------------------------------------
  const showPreviousImage = () => {
    if (selectedImageIndex <= 0) return;

    const nextIndex = selectedImageIndex - 1;

    setSelectedImageIndex(nextIndex);

    imageListRef.current?.scrollToIndex({
      index: nextIndex,
      animated: true,
    });
  };

  // ---------------------------------------------------------------------------------
  const showNextImage = () => {
    if (
      !listing ||
      selectedImageIndex >= listing.images.length - 1
    ) {
      return;
    }

    const nextIndex = selectedImageIndex + 1;

    setSelectedImageIndex(nextIndex);

    imageListRef.current?.scrollToIndex({
      index: nextIndex,
      animated: true,
    });
  };

  const webSwipeResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
      Platform.OS === "web" &&
      Math.abs(gestureState.dx) > 10 &&
      Math.abs(gestureState.dx) > Math.abs(gestureState.dy),

    onPanResponderRelease: (_, gestureState) => {
      const SWIPE_THRESHOLD = 50;

      if (gestureState.dx > SWIPE_THRESHOLD) {
        showPreviousImage();
      } else if (gestureState.dx < -SWIPE_THRESHOLD) {
        showNextImage();
      }
    },
  });

  // ---------------------------------------------------------------------------------
  const selectThumbnail = (index: number) => {
    setSelectedImageIndex(index);
  };

  // ---------------------------------------------------------------------------------
  const openImageViewer = () => {
    setIsImageViewerOpen(true);

    requestAnimationFrame(() => {
      imageListRef.current?.scrollToIndex({
        index: selectedImageIndex,
        animated: false,
      });
    });
  };

  // ---------------------------------------------------------------------------------
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" />

        <Text className="mt-3 text-gray-500">
          Loading listing...
        </Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------------
  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Text className="text-center text-base text-red-500">
          {error}
        </Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------------
  if (!listing) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-500">
          Listing not found.
        </Text>
      </View>
    );
  }

  const selectedImage =
    listing.images[selectedImageIndex];

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerClassName="pb-12 pt-4"
      showsVerticalScrollIndicator={false}
    >
      <View
        className={
          isDesktop
            ? "mx-auto w-full max-w-6xl flex-row gap-10 px-8"
            : "w-full px-4"
        }
      >
        {/* Image section */}
        <View
          className={
            isDesktop
              ? "flex-1"
              : "w-full"
          }
        >
          {/* Main image */}
          {selectedImage ? (
            <Pressable
              onPress={openImageViewer}
              className="w-full overflow-hidden rounded-2xl bg-gray-100"
              style={{
                aspectRatio: 4 / 3,
              }}
            >
              <Image
                source={{
                  uri: selectedImage.url,
                }}
                className="h-full w-full"
                resizeMode="contain"
              />

              <View className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-2">
                <Text className="text-xs font-semibold text-white">
                  Tap to enlarge
                </Text>
              </View>
            </Pressable>
          ) : (
            <View
              className="w-full items-center justify-center rounded-2xl bg-gray-100"
              style={{
                aspectRatio: 4 / 3,
              }}
            >
              <Text className="text-gray-400">
                No images
              </Text>
            </View>
          )}

          {/* Image thumbnails */}
          {listing.images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-3"
              contentContainerClassName="gap-3"
            >
              {listing.images.map((image, index) => {
                const isSelected =
                  index === selectedImageIndex;

                return (
                  <Pressable
                    key={image.id}
                    onPress={() =>
                      selectThumbnail(index)
                    }
                    className={`overflow-hidden rounded-xl ${
                      isSelected
                        ? "border-2 border-gray-950"
                        : "border border-gray-200"
                    }`}
                    style={{
                      width: 80,
                      height: 80,
                    }}
                  >
                    <Image
                      source={{
                        uri: image.url,
                      }}
                      className="h-full w-full bg-gray-100"
                      resizeMode="contain"
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Details section */}
        <View
          className={
            isDesktop
              ? "w-95"
              : "mt-6 w-full"
          }
        >
          <Text className="text-sm font-semibold uppercase tracking-widest text-gray-500">
            {listing.category}
          </Text>

          <Text className="mt-2 text-3xl font-bold text-gray-950">
            {listing.title}
          </Text>

          <Text className="mt-4 text-2xl font-bold text-gray-950">
            KSh {listing.price}
          </Text>

          <View className="mt-8">
            <Text className="text-lg font-bold text-gray-950">
              Description
            </Text>

            <Text className="mt-2 text-base leading-6 text-gray-600">
              {listing.description}
            </Text>

            <ContactActions
              phone={listing.seller.phone}
              contactName={null}
              contextLabel={listing.title}
              isOwnPost={user?.id === listing.seller_id}
              contactUnlocked={listing.contact_unlocked}
              onUnlockContact={handleUnlockContact}
              isUnlocking={isUnlocking}
            />

          </View>

          <View className="mt-8 rounded-2xl bg-white p-5">
            <Text className="text-sm font-semibold uppercase tracking-widest text-gray-500">
              Seller
            </Text>

            <Text className="mt-2 text-lg font-bold text-gray-950">
              KU Marketplace Seller
            </Text>
          </View>
        </View>
      </View>

      <View className="mt-5 rounded-2xl border border-gray-200 bg-white p-4">
        <Text className="text-sm font-bold text-gray-950">
          Something wrong with this listing?
        </Text>

        <Text className="mt-1 text-xs leading-4 text-gray-500">
          Report a problem or tell us how we can improve the marketplace.
        </Text>

        <View className="mt-3 self-start">
          <FeedbackButton
            label="Report a problem / Give feedback"
            onPress={() => setFeedbackVisible(true)}
          />
        </View>
      </View>

      <FeedbackModal
        visible={feedbackVisible}
        onClose={() => setFeedbackVisible(false)}
        screen="marketplace_listing"
      />

      {/* Fullscreen image viewer */}
      {Platform.OS === "web" ? (
        <Modal
          visible={isImageViewerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsImageViewerOpen(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.92)",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            {/* Close button */}
            <Pressable
              onPress={() => setIsImageViewerOpen(false)}
              style={{
                position: "absolute",
                top: 20,
                right: 24,
                zIndex: 20,
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 24,
                  lineHeight: 24,
                }}
              >
                ×
              </Text>
            </Pressable>

            {/* Image counter */}
            <View
              style={{
                position: "absolute",
                top: 28,
                left: 24,
                zIndex: 20,
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                {selectedImageIndex + 1} / {listing.images.length}
              </Text>
            </View>

            {/* Image area */}
            <View
              {...webSwipeResponder.panHandlers}
              style={{
                width: "100%",
                height: "82%",
                maxWidth: 1100,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={{ uri: selectedImage?.url }}
                style={{
                  width: "100%",
                  height: "100%",
                }}
                resizeMode="contain"
              />
            </View>

            {/* Previous */}
            {selectedImageIndex > 0 && (
              <Pressable
                onPress={showPreviousImage}
                style={{
                  position: "absolute",
                  left: 24,
                  top: "50%",
                  marginTop: -24,
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: 32,
                    lineHeight: 32,
                  }}
                >
                  ‹
                </Text>
              </Pressable>
            )}

            {/* Next */}
            {selectedImageIndex < listing.images.length - 1 && (
              <Pressable
                onPress={showNextImage}
                style={{
                  position: "absolute",
                  right: 24,
                  top: "50%",
                  marginTop: -24,
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: 32,
                    lineHeight: 32,
                  }}
                >
                  ›
                </Text>
              </Pressable>
            )}
          </View>
        </Modal>
      ) : (
        <Modal
          visible={isImageViewerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsImageViewerOpen(false)}
        >
          <View className="flex-1 bg-black">
            <FlatList
              ref={imageListRef}
              data={listing.images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={selectedImageIndex}
              keyExtractor={(item) => item.id}
              getItemLayout={(_, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(
                  event.nativeEvent.contentOffset.x / width,
                );

                setSelectedImageIndex(index);
              }}
              renderItem={({ item }) => (
                <View
                  style={{ width }}
                  className="flex-1 items-center justify-center"
                >
                  <Image
                    source={{ uri: item.url }}
                    className="h-full w-full"
                    resizeMode="contain"
                  />
                </View>
              )}
            />

            {/* Close */}
            <Pressable
              onPress={() => setIsImageViewerOpen(false)}
              className="absolute right-5 top-12 z-20 h-11 w-11 items-center justify-center rounded-full bg-white/20"
            >
              <Text className="text-2xl text-white">×</Text>
            </Pressable>

            {/* Previous */}
            {selectedImageIndex > 0 && (
              <Pressable
                onPress={showPreviousImage}
                className="absolute left-4 top-1/2 z-20 h-12 w-12 items-center justify-center rounded-full bg-white/20"
              >
                <Text className="text-3xl text-white">‹</Text>
              </Pressable>
            )}

            {/* Next */}
            {selectedImageIndex < listing.images.length - 1 && (
              <Pressable
                onPress={showNextImage}
                className="absolute right-4 top-1/2 z-20 h-12 w-12 items-center justify-center rounded-full bg-white/20"
              >
                <Text className="text-3xl text-white">›</Text>
              </Pressable>
            )}

            {/* Counter */}
            <View className="absolute bottom-8 left-0 right-0 items-center">
              <Text className="font-semibold text-white">
                {selectedImageIndex + 1} / {listing.images.length}
              </Text>
            </View>
          </View>
        </Modal>
      )}

      {/* Marketplace Modal */}
      <MarketplacePaymentModal
        visible={paymentModalVisible}
        transaction={connectionTransaction}
        phoneNumber={user?.phone ?? ""}
        onClose={() => setPaymentModalVisible(false)}
        onPaymentSuccess={async () => {
          setPaymentModalVisible(false);
          setConnectionTransaction(null);
          await loadListing();
        }}
      />
    </ScrollView>

  );
}
