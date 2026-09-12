import { Stack } from "expo-router";

export default function MarketplaceLayout() {
  return (
    <Stack>
        <Stack.Screen
          name="index"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="listings"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="wanted"
          options={{ headerShown: false }}
        />

      <Stack.Screen
        name="my-marketplace"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  )
}