import { useQuery } from "@tanstack/react-query";
import { createContext, useState, type ReactNode } from "react";

import { getMe } from "@/services/auth.service";
import type { User } from "@/types/user";

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isReady: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

export const AuthContext = createContext<AuthContextValue>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() =>
    localStorage.getItem("auth_token"),
  );
  const [userState, setUserState] = useState<User | null>(null);

  // Only query /me when we have a token but no user yet (e.g. page refresh)
  const { data: queriedUser, isFetched } = useQuery<User | null>({
    queryKey: ["me", token],
    enabled: !!token && !userState,
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

  function setAuth(t: string, user: User) {
    localStorage.setItem("auth_token", t);
    setTokenState(t);
    setUserState(user);
  }

  function clearAuth() {
    localStorage.removeItem("auth_token");
    setTokenState(null);
    setUserState(null);
  }

  const user = userState ?? queriedUser ?? null;
  const isReady = !token || !!userState || isFetched;

  return (
    <AuthContext.Provider
      value={{ user, token, isReady, setAuth, clearAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}
