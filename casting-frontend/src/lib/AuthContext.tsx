import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { Me, UpdateMeRequest } from "@/lib/api";
import { getMe, login as apiLogin, logout as apiLogout, setupAccount as apiSetup, updateMe as apiUpdateMe } from "@/lib/api";
import type { LoginRequest, SetupRequest } from "@/lib/api";

interface AuthState {
  user: Me | null;
  loading: boolean;
  login: (req: LoginRequest) => Promise<Me>;
  logout: () => Promise<void>;
  setup: (req: SetupRequest) => Promise<Me>;
  updateProfile: (req: UpdateMeRequest) => Promise<Me>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (req: LoginRequest) => {
    const me = await apiLogin(req);
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const setup = useCallback(async (req: SetupRequest) => {
    const me = await apiSetup(req);
    setUser(me);
    return me;
  }, []);

  const updateProfile = useCallback(async (req: UpdateMeRequest) => {
    const me = await apiUpdateMe(req);
    setUser(me);
    return me;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setup, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}