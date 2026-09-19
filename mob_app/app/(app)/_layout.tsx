import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import WebAppShell from "@/components/web/WebAppShell";

export default function AppLayout() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <WebAppShell>
      <Stack screenOptions={{ headerShown: false }} />
    </WebAppShell>
  );
}