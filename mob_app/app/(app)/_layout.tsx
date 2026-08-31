import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function AppLayout() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }}/>;
}