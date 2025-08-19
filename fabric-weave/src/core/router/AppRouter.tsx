// src/core/auth/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

type Profile = {
  id: string;
  email: string;
  name?: string;
  roles?: string[];
  permissions?: string[];
  // add anything else your API returns
};

type AuthContextShape = {
  user: Profile | null;     // alias for profile to satisfy components expecting either
  profile: Profile | null;
  loading: boolean;

  // actions
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;

  // convenience checks (optional if your ctx.rbac covers it)
  hasRole: (r: string) => boolean;
  hasPermission: (p: string) => boolean;
};

const AuthCtx = createContext<AuthContextShape | null>(null);

export function useAuth(): AuthContextShape {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("AuthProvider is missing in the tree");
  return v;
}

/** Resolve API base:
 *  - window.__API_BASE__ (injected at runtime)
 *  - VITE_API_BASE (env at build)
 *  - same-origin ('')
 */
const API_BASE =
  (typeof window !== "undefined" && (window as any).__API_BASE__) ||
  (import.meta as any).env?.VITE_API_BASE ||
  "";

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    credentials: "include",
  });
  // Try to parse body even on non-OK
  const text = await res.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null as any;
  if (!res.ok) {
    const msg = typeof data === "string" ? data : data?.message || res.statusText;
    throw new Error(`${res.status} ${msg}`.trim());
  }
  return data as T;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const bootstrapped = useRef(false);

  const refresh = async () => {
    // GET /api/auth/me should return the current profile or 401
    try {
      setLoading(true);
      const me = await jsonFetch<Profile>(`${API_BASE}/api/auth/me`, { method: "GET" });
      setProfile(normalizeProfile(me));
    } catch (e) {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    // Adjust to your API; common pattern shown here
    await jsonFetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await refresh();
  };

  const signOut = async () => {
    try {
      await jsonFetch(`${API_BASE}/api/auth/logout`, { method: "POST" });
    } catch {
      // ignore network/logout errors; still clear local state
    } finally {
      setProfile(null);
    }
  };

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    refresh();

    // Optional: auto-refresh on tab focus
    const onFocus = () => {
      // Donâ€™t spam if already loading
      if (!loading) refresh().catch(() => void 0);
    };
    window.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const hasRole = (r: string) => {
    const roles = profile?.roles || [];
    return roles.includes(r);
  };

  const hasPermission = (p: string) => {
    const perms = profile?.permissions || [];
    return perms.includes(p);
  };

  const value = useMemo<AuthContextShape>(
    () => ({
      user: profile,               // alias maintained for components expecting `user`
      profile,
      loading,
      signIn,
      signOut,
      refresh,
      hasRole,
      hasPermission,
    }),
    [profile, loading]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

function normalizeProfile(p: Profile | null): Profile | null {
  if (!p) return null;
  return {
    ...p,
    roles: Array.isArray(p.roles) ? p.roles : [],
    permissions: Array.isArray(p.permissions) ? p.permissions : [],
  };
}

