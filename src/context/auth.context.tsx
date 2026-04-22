import { createContext, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/services/auth.service";
import type { User } from "@/types/user";

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isReady: boolean;
  setAuth: (token: string) => void;
  clearAuth: () => void;
}

export const AuthContext = createContext<AuthContextValue>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() =>
    localStorage.getItem("auth_token"),
  );

  const { data: user, isFetched } = useQuery<User | null>({
    queryKey: ["me", token],
    enabled: !!token,
    retry: false,
    queryFn: async () => {
      try {
        return await getMe(token!);
      } catch {
        localStorage.removeItem("auth_token");
        setTokenState(null);
        return null;
      }
    },
  });

  function setAuth(t: string) {
    localStorage.setItem("auth_token", t);
    setTokenState(t);
  }

  function clearAuth() {
    localStorage.removeItem("auth_token");
    setTokenState(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        token,
        isReady: !token || isFetched,
        setAuth,
        clearAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
