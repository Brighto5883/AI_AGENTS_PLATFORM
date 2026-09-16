import { Stack } from "expo-router";

export default function ListingsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[listingId]"
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="[listingId]/edit"
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="create-listing"
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="my-listings"
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}