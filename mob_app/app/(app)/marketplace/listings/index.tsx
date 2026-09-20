import { useTransientError } from "@/hooks/useTransientError";

import { useCallback, useEffect, useState } from "react";
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
import { router } from "expo-router";

import ListingCard from "@/components/marketplace/ListingCard";
import { getListings } from "@/services/marketplaceService";
import {
  categories,
  type MarketplaceCategory,
  type Listing,
  type ListingSort,
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

export default function AllListings() {
  const { width } = useWindowDimensions();

  const [listings, setListings] = useState<Listing[]>([]);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

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

  const numColumns =
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

  const handleSearch = () => {
    setSearch(searchInput.trim());
  };

  const handleCategoryChange = (
    value: CategoryFilter,
  ) => {
    setCategory(
      value === "All"
        ? null
        : value,
    );
  };

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

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" />

        <Text className="mt-3 text-gray-500">
          Loading listings...
        </Text>
      </View>
    );
  }

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

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        key={numColumns}
        data={listings}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadListings(true)}
          />
        }
        columnWrapperClassName={
          numColumns > 1
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
            {/* Header */}
            <View>
              <Text className="text-sm font-semibold uppercase tracking-widest text-gray-500">
                KU Marketplace
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
                Everything for sale
              </Text>

              <Text className="mt-3 max-w-2xl text-base leading-6 text-gray-500">
                Browse everything currently available
                from the KU community.
              </Text>
            </View>

            {/* Search */}
            <View className="mt-6 flex-row items-center rounded-2xl border border-gray-200 bg-white px-4">
              <TextInput
                value={searchInput}
                onChangeText={setSearchInput}
                onSubmitEditing={handleSearch}
                placeholder="Search products..."
                placeholderTextColor="#9ca3af"
                returnKeyType="search"
                className="flex-1 py-4 text-base text-gray-900"
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

            {/* Categories */}
            <View className="mt-5">
              <FlatList
                horizontal
                data={categoryFilters}
                keyExtractor={(item) => item}
                showsHorizontalScrollIndicator={false}
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

            {/* Filter controls */}
            <View className="mt-4 flex-row items-center gap-3">
              <Pressable
                onPress={() =>
                  setShowFilters((current) => !current)
                }
                className="flex-row items-center rounded-xl border border-gray-200 bg-white px-4 py-3"
              >
                <Text className="font-semibold text-gray-700">
                  {showFilters ? "Hide filters" : "Filters"}
                </Text>
              </Pressable>

              {(search ||
                category ||
                minPrice !== undefined ||
                maxPrice !== undefined ||
                sort !== "recent") && (
                <Pressable
                  onPress={handleClearFilters}
                  className="rounded-xl px-3 py-3"
                >
                  <Text className="font-semibold text-gray-500">
                    Clear
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Filters */}
            {showFilters && (
              <View className="mt-4 rounded-2xl border border-gray-200 bg-white p-5">
                <Text className="text-sm font-semibold text-gray-700">
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
