
import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import type { Listing, WantedPost } from "@/types/marketplace";
import ListingCard from "@/components/marketplace/ListingCard";
import WantedPostCard from "@/components/marketplace/WantedPostCard";
import {
  deleteListing,
  deleteWantedPost,
  getMyListings,
  getMyWantedPosts,
  markListingSold,
  markWantedPostFulfilled,
} from "@/services/marketplaceService";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";


//====================================================================================

export default function MyMarketplace() {
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [wantedPosts, setWantedPosts] = useState<WantedPost[]>([]);

  const [activeTab, setActiveTab] = useState<"listings" | "wanted">(
    "listings",
  );

  const [loading, setLoading] = useState(true);
  const [wantedLoading, setWantedLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [processingId, setProcessingId] = useState<string | null>(null);

  //==================================================================================
  // Load user's listings
  //==================================================================================

  const loadListings = useCallback(async () => {
    try {
      setError(null);

      const data = await getMyListings();
      setListings(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load your listings.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  //==================================================================================
  // Load user's wanted posts
  //==================================================================================

  const loadWantedPosts = useCallback(async () => {
    try {
      setWantedLoading(true);
      setError(null);

      const data = await getMyWantedPosts();
      setWantedPosts(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load your wanted posts.",
      );
    } finally {
      setWantedLoading(false);
    }
  }, []);

  //==================================================================================
  // Reload the currently selected section whenever the screen receives focus
  //==================================================================================

  useFocusEffect(
    useCallback(() => {
      if (activeTab === "listings") {
        loadListings();
      } else {
        loadWantedPosts();
      }
    }, [activeTab, loadListings, loadWantedPosts]),
  );

  //==================================================================================
  // Pull-to-refresh
  //==================================================================================

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      if (activeTab === "listings") {
        await loadListings();
      } else {
        await loadWantedPosts();
      }
    } finally {
      setRefreshing(false);
    }
  };

  //==================================================================================
  // Mark listing as sold
  //==================================================================================

  const handleMarkSold = (listing: Listing) => {
    Alert.alert(
      "Mark as sold",
      `Mark "${listing.title}" as sold?

It will immediately disappear from the public marketplace. You can still manage it from My Marketplace for 7 days, after which it will be permanently deleted.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Mark as sold",
          onPress: async () => {
            try {
              setProcessingId(listing.id);

              const updatedListing = await markListingSold(listing.id);

              setListings((current) =>
                current.map((item) =>
                  item.id === listing.id
                    ? updatedListing
                    : item,
                ),
              );

              const deletionDate = updatedListing.scheduled_deletion_at
                ? new Date(
                    updatedListing.scheduled_deletion_at,
                  ).toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "7 days from now";

              Alert.alert(
                "Listing marked as sold",
                `This listing is hidden from the marketplace and is scheduled for permanent deletion on ${deletionDate}.`,
              );
            } catch (err) {
              Alert.alert(
                "Error",
                err instanceof Error
                  ? err.message
                  : "Failed to mark listing as sold.",
              );
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

//==================================================================================
// Delete listing
//==================================================================================

const handleDeleteListing = (listing: Listing) => {
  Alert.alert(
    "Delete listing",
    `Are you sure you want to permanently delete "${listing.title}"?`,
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setProcessingId(listing.id);

            await deleteListing(listing.id);

            setListings((current) =>
              current.filter(
                (item) => item.id !== listing.id,
              ),
            );
          } catch (err) {
            Alert.alert(
              "Error",
              err instanceof Error
                ? err.message
                : "Failed to delete listing.",
            );
          } finally {
            setProcessingId(null);
          }
        },
      },
    ],
  );
};

//==================================================================================
// Mark wanted post as fulfilled
//==================================================================================

  const handleMarkFulfilled = (wantedPost: WantedPost) => {
    Alert.alert(
      "Mark as fulfilled",
      `Are you sure you want to mark "${wantedPost.title}" as fulfilled?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Mark as fulfilled",
          onPress: async () => {
            try {
              setProcessingId(wantedPost.id);

              await markWantedPostFulfilled(wantedPost.id);

              setWantedPosts((current) =>
                current.map((item) =>
                  item.id === wantedPost.id
                    ? { ...item, is_open: false }
                    : item,
                ),
              );
            } catch (err) {
              Alert.alert(
                "Error",
                err instanceof Error
                  ? err.message
                  : "Failed to mark wanted post as fulfilled.",
              );
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

//==================================================================================
// Delete wanted post
//==================================================================================

  const handleDeleteWantedPost = (wantedPost: WantedPost) => {
    Alert.alert(
      "Delete request",
      `Are you sure you want to permanently delete "${wantedPost.title}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setProcessingId(wantedPost.id);

              await deleteWantedPost(wantedPost.id);

              setWantedPosts((current) =>
                current.filter(
                  (item) => item.id !== wantedPost.id,
                ),
              );
            } catch (err) {
              Alert.alert(
                "Error",
                err instanceof Error
                  ? err.message
                  : "Failed to delete wanted post.",
              );
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

  //==================================================================================
  // Initial loading state
  //==================================================================================

  if (loading && activeTab === "listings") {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" />

        <Text className="mt-3 text-gray-600">
          Loading your marketplace...
        </Text>
      </View>
    );
  }

  //==================================================================================
  // Render
  //==================================================================================

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="border-b border-gray-200 bg-white px-5 pb-4 pt-4">
        <Text className="text-2xl font-bold text-gray-950">
          My Marketplace
        </Text>

        {/* Tabs */}
        <View className="mt-4 flex-row">
          <Pressable
            className={`rounded-full px-5 py-2 ${
              activeTab === "listings"
                ? "bg-gray-950"
                : "bg-gray-100"
            }`}
            onPress={() => {
              setError(null);
              setActiveTab("listings");
            }}
          >
            <Text
              className={`font-semibold ${
                activeTab === "listings"
                  ? "text-white"
                  : "text-gray-700"
              }`}
            >
              For Sale
            </Text>
          </Pressable>

          <Pressable
            className={`ml-2 rounded-full px-5 py-2 ${
              activeTab === "wanted"
                ? "bg-gray-950"
                : "bg-gray-100"
            }`}
            onPress={() => {
              setError(null);
              setActiveTab("wanted");

              if (wantedPosts.length === 0) {
                loadWantedPosts();
              }
            }}
          >
            <Text
              className={`font-semibold ${
                activeTab === "wanted"
                  ? "text-white"
                  : "text-gray-700"
              }`}
            >
              Wanted
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-5"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        {/* Error */}
        {error ? (
          <View className="rounded-2xl bg-red-50 p-5">
            <Text className="font-semibold text-red-700">
              {error}
            </Text>

            <Pressable
              className="mt-4 self-start rounded-xl bg-red-600 px-4 py-2"
              onPress={
                activeTab === "listings"
                  ? loadListings
                  : loadWantedPosts
              }
            >
              <Text className="font-semibold text-white">
                Try again
              </Text>
            </Pressable>
          </View>
        ) : activeTab === "listings" ? (
          //===========================================================================
          // FOR SALE
          //===========================================================================

          listings.length === 0 ? (
            <View className="items-center rounded-2xl bg-white p-8">
              <Text className="text-lg font-semibold text-gray-950">
                No listings yet
              </Text>

              <Text className="mt-2 text-center text-gray-500">
                Items you put up for sale will appear here.
              </Text>

              <Pressable
                className="mt-5 rounded-xl bg-gray-950 px-5 py-3"
                onPress={() =>
                  router.push(
                    "/marketplace/listings/create-listing",
                  )
                }
              >
                <Text className="font-semibold text-white">
                  Sell something
                </Text>
              </Pressable>
            </View>
          ) : (
            listings.map((listing) => (
              <View key={listing.id}>
                <ListingCard
                  listing={listing}
                  onPress={() =>
                    router.push(
                      `/marketplace/listings/${listing.id}`,
                    )
                  }
                />

                <View className="-mt-2 mb-5 flex-row">
                  {/* Edit */}
                  <Pressable
                    className="mr-2 flex-1 rounded-xl bg-gray-200 px-3 py-3"
                    onPress={() =>
                      router.push(
                        `/marketplace/listings/${listing.id}/edit`,
                      )
                    }
                    disabled={processingId === listing.id}
                  >
                    <Text className="text-center font-semibold text-gray-900">
                      Edit
                    </Text>
                  </Pressable>

                  {/* Sold */}
                  {listing.is_active ? (
                    <Pressable
                      className="mr-2 flex-1 rounded-xl bg-gray-950 px-3 py-3"
                      onPress={() => handleMarkSold(listing)}
                      disabled={processingId === listing.id}
                    >
                      {processingId === listing.id ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text className="text-center font-semibold text-white">
                          Mark Sold
                        </Text>
                      )}
                    </Pressable>
                  ) : (
                    <View className="mr-2 flex-1 items-center justify-center rounded-xl bg-gray-200 px-3 py-3">
                      <Text className="font-semibold text-gray-500">
                        Sold
                      </Text>
                    </View>
                  )}

                  {/* Delete */}
                  <Pressable
                    className="flex-1 rounded-xl bg-red-50 px-3 py-3"
                    onPress={() => handleDeleteListing(listing)}
                    disabled={processingId === listing.id}
                  >
                    {processingId === listing.id ? (
                      <ActivityIndicator />
                    ) : (
                      <Text className="text-center font-semibold text-red-600">
                        Delete
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ))
          )
        ) : wantedLoading ? (
          //===========================================================================
          // WANTED LOADING
          //===========================================================================

          <View className="items-center py-10">
            <ActivityIndicator size="large" />

            <Text className="mt-3 text-gray-500">
              Loading your wanted posts...
            </Text>
          </View>
        ) : wantedPosts.length === 0 ? (
          //===========================================================================
          // NO WANTED POSTS
          //===========================================================================

          <View className="items-center rounded-2xl bg-white p-8">
            <Text className="text-lg font-semibold text-gray-950">
              No wanted posts yet
            </Text>

            <Text className="mt-2 text-center text-gray-500">
              Things you're looking for will appear here.
            </Text>

            <Pressable
              className="mt-5 rounded-xl bg-gray-950 px-5 py-3"
              onPress={() =>
                router.push(
                  "/marketplace/wanted/create-wanted",
                )
              }
            >
              <Text className="font-semibold text-white">
                Create wanted post
              </Text>
            </Pressable>
          </View>
        ) : (
          //===========================================================================
          // WANTED POSTS
          //===========================================================================

          wantedPosts.map((wantedPost) => (
            <View key={wantedPost.id}>
              <WantedPostCard
                wantedPost={wantedPost}
                onPress={() =>
                  router.push(
                    `/marketplace/wanted/${wantedPost.id}`,
                  )
                }
              />
              <View className="-mt-2 mb-5 flex-row">
                {/* Edit */}
                <Pressable
                  className="mr-2 flex-1 rounded-xl bg-gray-200 px-3 py-3"
                  onPress={() =>
                    router.push(
                      `/marketplace/wanted/${wantedPost.id}/edit`,
                    )
                  }
                  disabled={processingId === wantedPost.id}
                >
                  <Text className="text-center font-semibold text-gray-900">
                    Edit
                  </Text>
                </Pressable>

                {/* Fulfilled */}
                {wantedPost.is_open ? (
                  <Pressable
                    className="mr-2 flex-1 rounded-xl bg-gray-950 px-3 py-3"
                    onPress={() =>
                      handleMarkFulfilled(wantedPost)
                    }
                    disabled={processingId === wantedPost.id}
                  >
                    {processingId === wantedPost.id ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-center font-semibold text-white">
                        Fulfilled
                      </Text>
                    )}
                  </Pressable>
                ) : (
                  <View className="mr-2 flex-1 items-center justify-center rounded-xl bg-gray-200 px-3 py-3">
                    <Text className="font-semibold text-gray-500">
                      Fulfilled
                    </Text>
                  </View>
                )}

                {/* Delete */}
                <Pressable
                  className="flex-1 rounded-xl bg-red-50 px-3 py-3"
                  onPress={() =>
                    handleDeleteWantedPost(wantedPost)
                  }
                  disabled={processingId === wantedPost.id}
                >
                  {processingId === wantedPost.id ? (
                    <ActivityIndicator />
                  ) : (
                    <Text className="text-center font-semibold text-red-600">
                      Delete
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
