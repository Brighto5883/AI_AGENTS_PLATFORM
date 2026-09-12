import "@/global.css";
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import FeedbackModal from "@/components/feedback/FeedbackModal";
import { useSessionFeedback } from "@/hooks/useSessionFeedback";

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  const {
    feedbackVisible,
    closeFeedback,
  } = useSessionFeedback(isAuthenticated && !isLoading);

  return (
    <>
      <RootNavigator />

      {!isLoading && isAuthenticated && (
        <FeedbackModal
          visible={feedbackVisible}
          onClose={closeFeedback}
          screen="session_exit"
          title="Before you go"
          description="Is there anything we could do better? Your feedback helps us improve the platform."
        />
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}



