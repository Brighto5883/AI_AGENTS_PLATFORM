import { useTransientError } from "@/hooks/useTransientError";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import WantedPostCard from "@/components/marketplace/WantedPostCard";
import { getWantedPosts } from "@/services/marketplaceService";
import type { WantedPost } from "@/types/marketplace";


export default function WantedPosts() {
  const [posts, setPosts] = useState<WantedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useTransientError();


  const load = useCallback(async (refresh = false) => {
    try {
      refresh ? setIsRefreshing(true) : setIsLoading(true);
      setError(null);
      const data = await getWantedPosts();
      setPosts(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load requests."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" />
        <Text className="mt-3 text-gray-500">Loading requests...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => load(true)}
          />
        }
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <WantedPostCard
            wantedPost={item}
            onPress={() =>
                router.push({
                  pathname: "/marketplace/wanted/[wantedId]",
                  params: {
                    wantedId: item.id,
                  },
                })
            }
          />
        )}
        ListHeaderComponent={
          <View className="mb-6">
            <Text className="text-sm font-semibold uppercase tracking-widest text-gray-500">
              KU Marketplace
            </Text>
            <Text className="mt-2 text-3xl font-bold text-gray-950">
              Buyers are looking for...
            </Text>
            <Text className="mt-2 text-base text-gray-500">
              Are you selling what someone needs? Reach out to them.
            </Text>

            <Pressable
              onPress={() => router.push("/marketplace/wanted/create-wanted")}
              className="mt-5 self-start rounded-2xl bg-gray-950 px-6 py-4"
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <Text className="text-center text-base font-bold text-white">
                + Post what you need
              </Text>
            </Pressable>

            {error && (
              <Text className="mt-4 text-sm text-red-500">{error}</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View className="items-center rounded-2xl bg-white p-8">
            <Text className="text-lg font-bold text-gray-900">
              No requests yet
            </Text>
            <Text className="mt-2 text-center text-gray-500">
              Be the first to post what you're looking for.
            </Text>
          </View>
        }
      />
    </View>
  );
}
