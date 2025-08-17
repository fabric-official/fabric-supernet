// src/pages/FabricDashboard.tsx
import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { FabricSidebar } from "@/components/FabricSidebar";
import { PluginManager } from "@/services/PluginManager";
import type { PluginRoute } from "@/types/plugin";

export const FabricDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState<PluginRoute[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Keep one PluginManager instance
  const mgrRef = useRef<PluginManager | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!mgrRef.current) mgrRef.current = new PluginManager();
        await mgrRef.current.loadPlugins(); // builds real PluginHost + RuntimeService (no mocks)
        const all = mgrRef.current.getAllRoutes(); // routes bound to real host
        setRoutes(all);
      } catch (e: any) {
        console.error("Failed to load plugins:", e);
        setError(e?.message || "Failed to load plugins");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Loading Fabric Dashboard</h1>
          <p className="text-muted-foreground">Initializing secure plugin environment…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Plugin load error</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const hasRoutes = routes && routes.length > 0;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <FabricSidebar />

        <div className="flex-1 flex flex-col">
          {/* Header with sidebar trigger */}
          <header className="h-14 flex items-center border-b border-border bg-card/50 px-4">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="ml-4">
              <h1 className="text-lg font-semibold text-foreground">Fabric Dashboard Host</h1>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            {hasRoutes ? (
              <Routes>
                {/* Default route -> /ops (adjust if your first route differs) */}
                <Route path="/" element={<Navigate to="/ops" replace />} />

                {routes.map((r) => (
                  // IMPORTANT: pass a React element, not call the component.
                  // r.element is a React.ComponentType (function or class)
                  <Route
                    key={r.path}
                    path={r.path}
                    element={React.createElement(r.element)}
                  />
                ))}

                {/* 404 fallback */}
                <Route
                  path="*"
                  element={
                    <div className="p-8 text-center text-muted-foreground">
                      <div className="text-2xl font-semibold text-foreground mb-2">Not found</div>
                      <div>There’s no page at that path.</div>
                    </div>
                  }
                />
              </Routes>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <div className="text-2xl font-semibold text-foreground mb-2">No plugins registered</div>
                <div>Plugin registry loaded but didn’t register any routes.</div>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
