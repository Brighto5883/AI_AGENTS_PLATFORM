import { Stack } from "expo-router";

export default function WantedLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="[wantedId]"
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="create-wanted"
        options={{ headerShown: false }}
      />

    </Stack>
  );
}