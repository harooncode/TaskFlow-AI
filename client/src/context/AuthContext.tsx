import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "../api";
import type { User } from "../types";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) return setLoading(false);
    api
      .me()
      .then((r) => setUser(r.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const value: AuthCtx = {
    user,
    loading,
    login: async (email, password) => {
      const r = await api.login({ email, password });
      setToken(r.token);
      setUser(r.user);
    },
    register: async (name, email, password) => {
      const r = await api.register({ name, email, password });
      setToken(r.token);
      setUser(r.user);
    },
    logout: () => {
      setToken(null);
      setUser(null);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
