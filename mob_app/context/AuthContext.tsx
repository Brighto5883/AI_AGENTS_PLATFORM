import { createContext, useContext, useEffect, useState } from "react";
import { getToken, saveToken, removeToken, } from "@/services/tokenService";

type AuthContextType = {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (newToken: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [token, setToken] = useState<string | null>(null);
  const isAuthenticated = token !== null;
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await getToken();
    
        setToken(storedToken);
      } catch (error) {
        console.error('Failed to load token:', error);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadToken();
  }, []);

  const login = async (newToken: string) => {
    await saveToken(newToken);
    setToken(newToken);
  };
  
  const logout = async () => {
    await removeToken();
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}