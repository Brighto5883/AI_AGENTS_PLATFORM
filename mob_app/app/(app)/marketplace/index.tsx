
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { router } from "expo-router";
import FeedbackButton from "@/components/feedback/feedbackButton";
import FeedbackModal from "@/components/feedback/FeedbackModal";
import ListingCard from "@/components/marketplace/ListingCard";
import { getListings, getMarketplaceBillingInfo } from "@/services/marketplaceService";
import MarketplaceBillingNotice from "@/components/marketplace/MarketplaceBillingNotice";
import type { MarketplaceBillingInfo } from "@/types/billing";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import {
  categories,
  type Listing,
  type ListingSort,
  type MarketplaceCategory,
} from "@/types/marketplace";




type CategoryFilter = "All" | MarketplaceCategory;

const categoryFilters: CategoryFilter[] = [
  "All",
  ...categories,
];

const sortOptions: {
  label: string;
  value: ListingSort;
}[] = [
  {
    label: "Recent",
    value: "recent",
  },
  {
    label: "Lowest price",
    value: "price_asc",
  },
  {
    label: "Highest price",
    value: "price_desc",
  },
];

type MarketplaceAction = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
  path:
    | "/marketplace/listings"
    | "/marketplace/listings/create-listing"
    | "/marketplace/wanted"
    | "/marketplace/wanted/create-wanted"
    | "/marketplace/my-marketplace";
};

const marketplaceActions: MarketplaceAction[] = [
  {
    title: "SELL SOMETHING",
    description: "List an item you want to sell.",
    icon: "pricetag-outline",
    iconColor: "#2563eb",
    iconBackground: "#dbeafe",
    path: "/marketplace/listings/create-listing",
  },

  {
    title: "BUY SOMETHING",
    description: "Browse everything currently for sale.",
    icon: "bag-handle-outline",
    iconColor: "#0891b2",
    iconBackground: "#cffafe",
    path: "/marketplace/listings",
  },

  {
    title: "REQUIRED BY BUYERS",
    description: "Look what buyers are asking for.",
    icon: "search-outline",
    iconColor: "#16a34a",
    iconBackground: "#dcfce7",
    path: "/marketplace/wanted",
  },
  {
    title: "POST WHAT YOU REQUIRE",
    description: "Post any item you need and sellers will reach out.",
    icon: "create-outline",
    iconColor: "#9333ea",
    iconBackground: "#f3e8ff",
    path: "/marketplace/wanted/create-wanted",
  },
  {
    title: "VIEW MY POSTS",
    description: "Manage all your listings posts here.",
    icon: "person-outline",
    iconColor: "#ea580c",
    iconBackground: "#ffedd5",
    path: "/marketplace/my-marketplace",
  },
];

export default function Marketplace() {
  const { width } = useWindowDimensions();

  const [listings, setListings] = useState<Listing[]>([]);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // null means "All categories"
  const [category, setCategory] =
    useState<MarketplaceCategory | null>(null);

  const [sort, setSort] =
    useState<ListingSort>("recent");

  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");

  const [minPrice, setMinPrice] =
    useState<number | undefined>();

  const [maxPrice, setMaxPrice] =
    useState<number | undefined>();

  const [showFilters, setShowFilters] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [nextOffset, setNextOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [billingInfo, setBillingInfo] = useState<MarketplaceBillingInfo | null>(null);

  useEffect(() => {
    void getMarketplaceBillingInfo().then(setBillingInfo).catch(() => undefined);
  }, []);

  //===========================================================================
  // Responsive layout
  //===========================================================================

  const listingColumns =
    width >= 1200
      ? 4
      : width >= 800
        ? 3
        : 2;

  const actionColumns =
    width >= 1100
      ? 4
      : 2;

  const horizontalPadding =
    width >= 1200
      ? 48
      : width >= 800
        ? 32
        : 20;

  const contentWidth =
    width - horizontalPadding * 2;

  const gap = width >= 800 ? 16 : 12;

  const actionCardWidth =
    (contentWidth -
      gap * (actionColumns - 1)) /
    actionColumns;

  //===========================================================================
  // Load listings
  //===========================================================================

  const loadListings = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        setError(null);

        const data = await getListings({
          search: search || undefined,
          category: category ?? undefined,
          min_price: minPrice,
          max_price: maxPrice,
          sort,
          limit: 20,
          offset: 0,
        });

        setListings(data.items);
        setNextOffset(data.next_offset);
        setHasMore(data.has_more);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load listings.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [
      search,
      category,
      minPrice,
      maxPrice,
      sort,
    ],
  );

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  //===========================================================================
  // Search
  //===========================================================================

  const handleSearch = () => {
    setSearch(searchInput.trim());
  };

  //===========================================================================
  // Category
  //===========================================================================

  const handleCategoryChange = (
    value: CategoryFilter,
  ) => {
    setCategory(
      value === "All"
        ? null
        : value,
    );
  };

  //===========================================================================
  // Filters
  //===========================================================================

  const handleApplyFilters = () => {
    const parsedMinPrice =
      minPriceInput.trim() === ""
        ? undefined
        : Number(minPriceInput);

    const parsedMaxPrice =
      maxPriceInput.trim() === ""
        ? undefined
        : Number(maxPriceInput);

    if (
      parsedMinPrice !== undefined &&
      Number.isNaN(parsedMinPrice)
    ) {
      return;
    }

    if (
      parsedMaxPrice !== undefined &&
      Number.isNaN(parsedMaxPrice)
    ) {
      return;
    }

    setMinPrice(parsedMinPrice);
    setMaxPrice(parsedMaxPrice);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearch("");
    setCategory(null);
    setSort("recent");
    setMinPriceInput("");
    setMaxPriceInput("");
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setShowFilters(false);
  };

  //===========================================================================
  // Pagination
  //===========================================================================

  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore) {
      return;
    }

    try {
      setIsLoadingMore(true);

      const data = await getListings({
        search: search || undefined,
        category: category ?? undefined,
        min_price: minPrice,
        max_price: maxPrice,
        sort,
        limit: 20,
        offset: nextOffset,
      });

      setListings((current) => [
        ...current,
        ...data.items,
      ]);

      setNextOffset(data.next_offset);
      setHasMore(data.has_more);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load more listings.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  };

  //===========================================================================
  // Loading state
  //===========================================================================

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" />

        <Text className="mt-3 text-gray-500">
          Loading marketplace...
        </Text>
      </View>
    );
  }

  //===========================================================================
  // Initial error state
  //===========================================================================

  if (error && listings.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Text className="text-center text-base text-red-500">
          {error}
        </Text>

        <Pressable
          onPress={() => loadListings()}
          className="mt-5 rounded-xl bg-gray-950 px-5 py-3"
        >
          <Text className="font-semibold text-white">
            Try again
          </Text>
        </Pressable>
      </View>
    );
  }

  //===========================================================================
  // Render
  //===========================================================================

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        key={listingColumns}
        data={listings}
        numColumns={listingColumns}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadListings(true)}
          />
        }
        columnWrapperClassName={
          listingColumns > 1
            ? "gap-4"
            : undefined
        }
        renderItem={({ item }) => (
          <View className="flex-1">
            <ListingCard
              listing={item}
              onPress={() =>
                router.push({
                  pathname:
                    "/marketplace/listings/[listingId]",
                  params: {
                    listingId: item.id,
                  },
                })
              }
            />
          </View>
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoadingMore ? (
            <View className="py-6">
              <ActivityIndicator />
            </View>
          ) : null
        }
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingTop: 24,
          paddingBottom: 40,
        }}
        ListHeaderComponent={
          <View className="mb-8">

        {/* ================================================================
            Header
        ================================================================= */}

            <Text className="text-sm font-semibold uppercase tracking-widest text-gray-500">
              KU Marketplace
            </Text>

            <Text
              className={
                width >= 800
                  ? "mt-2 text-5xl font-bold text-gray-950"
                  : "mt-2 text-4xl font-bold text-gray-950"
              }
            >
              Discover. Buy. Sell. Enquire. Connect
            </Text>

            <Text className="mt-3 max-w-2xl text-base leading-6 text-gray-500">
              Find what you need or sell something to the KU community.
            </Text>

            {billingInfo ? (
              <View className="mt-5">
                <MarketplaceBillingNotice billing={billingInfo} />
              </View>
            ) : null}

        {/* ================================================================
            Search
        ================================================================= */}

            <View
              className={
                width >= 800
                  ? "mt-7 max-w-4xl flex-row items-center rounded-2xl border border-gray-200 bg-white px-4"
                  : "mt-6 flex-row items-center rounded-2xl border border-gray-200 bg-white px-4"
              }
            >
              <Ionicons
                name="search-outline"
                size={20}
                color="#9ca3af"
              />

              <TextInput
                value={searchInput}
                onChangeText={setSearchInput}
                onSubmitEditing={handleSearch}
                placeholder="Search products..."
                placeholderTextColor="#9ca3af"
                returnKeyType="search"
                className="flex-1 py-4 pl-3 text-base text-gray-900"
              />

              <Pressable
                onPress={handleSearch}
                className="rounded-xl bg-gray-950 px-4 py-2.5"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text className="font-semibold text-white">
                  Search
                </Text>
              </Pressable>
            </View>

        {/* ================================================================
            Categories
        ================================================================= */}

            <View className="mt-5">
              <FlatList
                horizontal
                data={categoryFilters}
                keyExtractor={(item) => item}
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={{
                  gap: 8,
                }}
                renderItem={({ item }) => {
                  const isActive =
                    item === "All"
                      ? category === null
                      : category === item;

                  return (
                    <Pressable
                      onPress={() =>
                        handleCategoryChange(item)
                      }
                      className={
                        isActive
                          ? "rounded-full bg-gray-950 px-5 py-2.5"
                          : "rounded-full border border-gray-200 bg-white px-5 py-2.5"
                      }
                    >
                      <Text
                        className={
                          isActive
                            ? "font-semibold text-white"
                            : "font-medium text-gray-600"
                        }
                      >
                        {item}
                      </Text>
                    </Pressable>
                  );
                }}
              />
            </View>

        {/* ================================================================
            Filter controls
        ================================================================= */}

            <View className="mt-4 flex-row items-center justify-between">
              <Pressable
                onPress={() =>
                  setShowFilters((current) => !current)
                }
                className="flex-row items-center rounded-xl border border-gray-200 bg-white px-4 py-3"
              >
                <Ionicons
                  name="options-outline"
                  size={17}
                  color="#374151"
                />

                <Text className="ml-2 font-semibold text-gray-700">
                  {showFilters
                    ? "Hide filters"
                    : "Filters"}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleClearFilters}
                className="px-3 py-3"
              >
                <Text className="font-semibold text-gray-500">
                  Clear
                </Text>
              </Pressable>
            </View>

        {/* ================================================================
            Filter panel
        ================================================================= */}

            {showFilters && (
              <View className="mt-4 rounded-2xl border border-gray-200 bg-white p-5">
                <Text className="text-base font-bold text-gray-900">
                  Filter & sort
                </Text>

                {/* Price */}
                <Text className="mt-5 text-sm font-semibold text-gray-700">
                  Price range
                </Text>

                <View className="mt-2 flex-row gap-3">
                  <TextInput
                    value={minPriceInput}
                    onChangeText={setMinPriceInput}
                    placeholder="Min price"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-gray-900"
                  />

                  <TextInput
                    value={maxPriceInput}
                    onChangeText={setMaxPriceInput}
                    placeholder="Max price"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-gray-900"
                  />
                </View>

                {/* Sort */}
                <Text className="mt-5 text-sm font-semibold text-gray-700">
                  Sort by
                </Text>

                <View className="mt-2 flex-row flex-wrap gap-2">
                  {sortOptions.map((option) => {
                    const isActive =
                      sort === option.value;

                    return (
                      <Pressable
                        key={option.value}
                        onPress={() =>
                          setSort(option.value)
                        }
                        className={
                          isActive
                            ? "rounded-xl bg-gray-950 px-4 py-3"
                            : "rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                        }
                      >
                        <Text
                          className={
                            isActive
                              ? "font-semibold text-white"
                              : "font-medium text-gray-600"
                          }
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Pressable
                  onPress={handleApplyFilters}
                  className="mt-5 rounded-xl bg-gray-950 py-3.5"
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text className="text-center font-bold text-white">
                    Apply filters
                  </Text>
                </Pressable>
              </View>
            )}

        {/* ================================================================
            Marketplace navigation
        ================================================================= */}

            <View className="mt-8">
              <Text className="text-xl font-bold text-gray-950">
                What would you like to do?
              </Text>

              <Text className="mt-1 text-sm leading-5 text-gray-500">
                Quickly access the marketplace tools you need.
              </Text>

              <View
                className="mt-4 flex-row flex-wrap"
                style={{
                  gap,
                }}
              >
                {marketplaceActions.map((action) => (
                  <Pressable
                    key={action.title}
                    onPress={() =>
                      router.push(action.path)
                    }
                    className="min-h-31.5 rounded-2xl border border-gray-200 bg-white p-4"
                    style={({ pressed }) => ({
                      width: actionCardWidth,
                      opacity: pressed ? 0.8 : 1,
                      transform: [
                        {
                          scale: pressed ? 0.985 : 1,
                        },
                      ],
                    })}
                  >
                    {/* Icon */}
                    <View
                      className="h-10 w-10 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor:
                          action.iconBackground,
                      }}
                    >
                      <Ionicons
                        name={action.icon}
                        size={20}
                        color={action.iconColor}
                      />
                    </View>

                    {/* Title */}
                    <Text className="mt-3 text-sm font-bold text-gray-950">
                      {action.title}
                    </Text>

                    {/* Description */}
                    <Text
                      numberOfLines={2}
                      className="mt-1 text-xs leading-4 text-gray-500"
                    >
                      {action.description}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

        {/* ================================================================
            Inline error
        ================================================================= */}

            {error && listings.length > 0 && (
              <View className="mt-5 rounded-xl bg-red-50 px-4 py-3">
                <Text className="text-center text-sm font-medium text-red-600">
                  {error}
                </Text>
              </View>
            )}

        {/* ================================================================
            Feedback
        ================================================================= */}

            <View className="mt-6 rounded-2xl border border-gray-200 bg-white p-4">
              <View className="flex-row items-center justify-between">
                <View className="mr-4 flex-1">
                  <Text className="text-sm font-bold text-gray-950">
                    Something not right?
                  </Text>

                  <Text className="mt-1 text-xs leading-4 text-gray-500">
                    Tell us about a marketplace problem or suggest an improvement.
                  </Text>
                </View>

                <FeedbackButton
                  label="Give feedback"
                  onPress={() => setFeedbackVisible(true)}
                />
              </View>
            </View>

            <FeedbackModal
              visible={feedbackVisible}
              onClose={() => setFeedbackVisible(false)}
              screen="marketplace"
            />

        {/* ================================================================
            Listings heading
        ================================================================= */}

            <View className="mt-9 mb-2 flex-row items-end justify-between">
              <View>
                <Text className="text-xl font-bold text-gray-950">
                  Latest listings
                </Text>

                <Text className="mt-1 text-sm text-gray-500">
                  Discover items available from the KU community.
                </Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center rounded-2xl bg-white p-8">
            <Text className="text-lg font-bold text-gray-900">
              No listings found
            </Text>

            <Text className="mt-2 text-center text-gray-500">
              Try changing your search or filters.
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
