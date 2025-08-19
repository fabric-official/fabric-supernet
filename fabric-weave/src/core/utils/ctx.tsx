import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { createApi } from "@/core/api/client";
import { createBus } from "@/core/bus";
import { AppStoreAPI } from "@/core/store";
import { createRBAC } from "@/core/rbac";
import { useAuth } from "@/core/auth/AuthProvider";

function useTheme() {
  const [isDark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );
  const toggle = () => {
    document.documentElement.classList.toggle("dark");
    setDark(document.documentElement.classList.contains("dark"));
  };
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  return { isDark, toggle };
}

const Ctx = createContext<any>(null);

export function CtxProvider({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const { profile } = useAuth();
  
  const value = useMemo(
    () => ({
      api: createApi("/api"),
      events: createBus(),
      store: AppStoreAPI,
      rbac: createRBAC(profile),
      theme,
    }),
    [theme, profile]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCtx = () => useContext(Ctx);