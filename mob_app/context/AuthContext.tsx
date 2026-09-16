import { createContext, useContext, useEffect, useState } from "react";
import { getToken, saveToken, removeToken } from "@/services/tokenService";
import { getCurrentUser } from "@/services/authService";
import { Alert } from "react-native";
import { isUserFriendlyNetworkError } from "@/services/api";
import { addUnauthorizedListener, resetUnauthorizedState } from "@/services/authEvents";
import type { AuthUser } from "@/types/auth";

type AuthContextType = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (newToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = token !== null;

  const loadUser = async () => {
    const profile = await getCurrentUser();
    setUser(profile);
  };

  useEffect(() => {
    const unsubscribe = addUnauthorizedListener(() => {
      setToken(null);
      setUser(null);
      Alert.alert("Session expired", "Your session has expired. Please log in again.");
    });

    const loadToken = async () => {
      try {
        const storedToken = await getToken();

        if (!storedToken) {
          setToken(null);
          return;
        }

        setToken(storedToken);

        try {
          await loadUser();
        } catch (error) {
          console.error("Failed to load user profile:", error);

          // A weak/offline connection must never turn a valid stored JWT
          // into a logout. Only an actual authenticated API failure should
          // invalidate the session here.
          if (isUserFriendlyNetworkError(error)) {
            setToken(storedToken);
            return;
          }

          await removeToken();
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to load token:", error);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void loadToken();

    return unsubscribe;
  }, []);

  const login = async (newToken: string) => {
    await saveToken(newToken);
    resetUnauthorizedState();
    setToken(newToken);
    await loadUser();
  };

  const logout = async () => {
    await removeToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ token, user, isAuthenticated, isLoading, login, logout, refreshUser: loadUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}