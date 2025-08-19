import React from "react";

type User = { id: string; email: string };
type Profile = { id: string; user_id: string; email: string; role?: string; permissions?: string[]; full_name?: string };

type Ctx = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const initial: Ctx = { user: null, profile: null, loading: true, signIn: async () => {}, signUp: async () => {}, signOut: () => {} };
export const AuthContext = React.createContext<Ctx>(initial);

const API = (import.meta.env.VITE_API_BASE || "/api").replace(/\/$/, "");
const BYPASS = String(import.meta.env.VITE_BYPASS_AUTH || "") === "1";
const BYPASS_ROLE = import.meta.env.VITE_BYPASS_ROLE || "admin";

function setSession(token: string, email: string) {
  localStorage.setItem("token", token);
  localStorage.setItem("email", email);
}
function getToken() { return localStorage.getItem("token"); }
function getEmail() { return localStorage.getItem("email") || ""; }
function clearSession() { localStorage.removeItem("token"); localStorage.removeItem("email"); }

async function httpJson<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { Accept: "application/json", "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(url, { ...init, headers });
  if (!r.ok) throw new Error(String(r.status));
  return r.json() as Promise<T>;
}

async function fetchMe(): Promise<Profile | null> {
  try { return await httpJson<Profile>(`${API}/auth/me`); }
  catch { return null; }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadProfile = React.useCallback(async () => {
    if (BYPASS) {
      const email = getEmail() || "dev@local";
      const fake: Profile = { id: "dev-guest", user_id: "dev-guest", email, role: BYPASS_ROLE, permissions: ["*"], full_name: "Developer (Bypass)" };
      setProfile(fake);
      setUser(prev => prev ?? { id: fake.id, email: fake.email });
      return;
    }
    const me = await fetchMe();
    if (me) { setProfile(me); setUser(prev => prev ?? { id: me.id, email: me.email }); }
    else { setProfile(null); }
  }, []);

  React.useEffect(() => {
    if (BYPASS) {
      const email = getEmail() || "dev@local";
      setUser({ id: "dev-guest", email });
      setProfile({ id: "dev-guest", user_id: "dev-guest", email, role: BYPASS_ROLE, permissions: ["*"], full_name: "Developer (Bypass)" });
      setLoading(false);
      return;
    }
    loadProfile().finally(() => setLoading(false));
  }, [loadProfile]);

  const signIn = async (email: string, password: string) => {
    if (BYPASS) { setSession("bypass", email); await loadProfile(); return; }
    const res = await httpJson<{ id: string; email: string; token: string }>(`${API}/auth/login`, { method: "POST", body: JSON.stringify({ email, password }) });
    setSession(res.token, res.email); await loadProfile();
  };

  const signUp = async (email: string, password: string) => {
    if (BYPASS) { setSession("bypass", email); await loadProfile(); return; }
    const res = await httpJson<{ id: string; email: string; token: string }>(`${API}/auth/register`, { method: "POST", body: JSON.stringify({ email, password }) });
    setSession(res.token, res.email); await loadProfile();
  };

  const signOut = () => { clearSession(); setUser(null); setProfile(null); };

  return <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => React.useContext(AuthContext);
