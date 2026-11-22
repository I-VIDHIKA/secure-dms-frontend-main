import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { User } from "@/types";
import { getCurrentUser } from "@/api/auth";
import { TOKEN_KEY, USER_KEY } from "@/api/client";

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(USER_KEY) || "null");
    if (!stored || typeof stored !== "object" || !("id" in stored) || !("role" in stored)) return null;
    return stored as User;
  } catch {
    return null;
  }
}

interface AuthCtx {
  user: User | null;
  signIn: (user: User, token: string) => void;
  signOut: () => void;
  updateSelf: (user: User) => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());

  useEffect(() => {
    if (!window.localStorage.getItem(TOKEN_KEY)) {
      window.localStorage.removeItem(USER_KEY);
      setUser(null);
      return;
    }
    let active = true;
    void getCurrentUser().then((current) => {
      if (!active) return;
      window.localStorage.setItem(USER_KEY, JSON.stringify(current));
      setUser(current);
    }).catch((error: unknown) => {
      if (active && (error instanceof Error)) toast.error(error.message);
    });
    return () => { active = false; };
  }, []);

  const signIn = useCallback((nextUser: User, token: string) => {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);
  const signOut = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);
  const updateSelf = useCallback((nextUser: User) => {
    window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  return <Ctx.Provider value={{ user, signIn, signOut, updateSelf }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const context = useContext(Ctx);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function useCurrentUser(): User {
  const { user } = useAuth();
  const current = user ?? getStoredUser();
  if (!current) throw new Error("Your session has expired. Please sign in again.");
  return current;
}