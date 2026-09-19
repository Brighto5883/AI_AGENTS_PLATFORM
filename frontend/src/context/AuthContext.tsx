import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { AuthUser } from "@/types";

import {
  getMe,
  login as loginRequest,
} from "@/services/apiServices";

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("campus_hub_access_token")
  );

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    setUser(await getMe());
  };

  useEffect(() => {
    const onUnauthorized = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener(
      "campus-hub:unauthorized",
      onUnauthorized
    );

    if (!token) {
      setLoading(false);

      return () =>
        window.removeEventListener(
          "campus-hub:unauthorized",
          onUnauthorized
        );
    }

    refreshUser()
      .catch(() => {
        localStorage.removeItem("campus_hub_access_token");

        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });

    return () =>
      window.removeEventListener(
        "campus-hub:unauthorized",
        onUnauthorized
      );
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      loading,

      login: async (email, password) => {
        const result = await loginRequest(email, password);

        localStorage.setItem(
          "campus_hub_access_token",
          result.access_token
        );

        setToken(result.access_token);
        setUser(await getMe());
      },

      logout: () => {
        localStorage.removeItem("campus_hub_access_token");

        setToken(null);
        setUser(null);
      },

      refreshUser,
    }),
    [token, user, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return value;
}