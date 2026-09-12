import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

const LAST_PROMPT_KEY = "feedback:last_session_prompt";

const PROMPT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_SESSION_DURATION_MS = 2 * 60 * 1000;

export function useSessionFeedback(enabled: boolean) {
  const [feedbackVisible, setFeedbackVisible] = useState(false);

  const appState = useRef<AppStateStatus>(AppState.currentState);
  const sessionStartedAt = useRef<number | null>(null);
  const hasPromptedThisSession = useRef(false);

  useEffect(() => {
    if (!enabled) {
      sessionStartedAt.current = null;
      hasPromptedThisSession.current = false;
      setFeedbackVisible(false);
      return;
    }

    sessionStartedAt.current = Date.now();
    hasPromptedThisSession.current = false;

    const handleAppStateChange = async (nextState: AppStateStatus) => {
      const previousState = appState.current;

      const isLeavingActiveState =
        previousState === "active" &&
        (nextState === "inactive" || nextState === "background");

      const isReturningToActive =
        (previousState === "inactive" || previousState === "background") &&
        nextState === "active";

      if (isLeavingActiveState && sessionStartedAt.current !== null) {
        const sessionDuration = Date.now() - sessionStartedAt.current;

        if (
          sessionDuration >= MIN_SESSION_DURATION_MS &&
          !hasPromptedThisSession.current
        ) {
          const lastPrompt = await AsyncStorage.getItem(LAST_PROMPT_KEY);

          const lastPromptAt = lastPrompt ? Number(lastPrompt) : null;

          const cooldownExpired =
            lastPromptAt === null ||
            !Number.isFinite(lastPromptAt) ||
            Date.now() - lastPromptAt >= PROMPT_COOLDOWN_MS;

          if (cooldownExpired) {
            await AsyncStorage.setItem(
              LAST_PROMPT_KEY,
              String(Date.now()),
            );

            hasPromptedThisSession.current = true;
          }
        }
      }

      if (isReturningToActive) {
        if (hasPromptedThisSession.current) {
          setFeedbackVisible(true);
        }

        sessionStartedAt.current = Date.now();
      }

      appState.current = nextState;
    };

    const subscription = AppState.addEventListener(
      "change",
      (nextState) => {
        void handleAppStateChange(nextState);
      },
    );

    return () => {
      subscription.remove();
      sessionStartedAt.current = null;
    };
  }, [enabled]);

  const closeFeedback = () => {
    setFeedbackVisible(false);
  };

  return {
    feedbackVisible,
    closeFeedback,
  };
}