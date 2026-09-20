import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_ERROR_DURATION_MS = 4000;

export function useTransientError(
  durationMs = DEFAULT_ERROR_DURATION_MS,
): [string | null, (message: string | null) => void] {
  const [error, setErrorState] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const setError = useCallback(
    (message: string | null) => {
      clearTimer();
      setErrorState(message);

      if (message) {
        timerRef.current = setTimeout(() => {
          setErrorState(null);
          timerRef.current = null;
        }, durationMs);
      }
    },
    [clearTimer, durationMs],
  );

  useEffect(() => clearTimer, [clearTimer]);

  return [error, setError];
}
