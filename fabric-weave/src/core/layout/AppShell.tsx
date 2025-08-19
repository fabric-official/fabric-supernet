// src/core/layout/AppShell.tsx
import React, { ReactNode, Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useAppStore } from "@/core/store";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children?: ReactNode; // optional so it also works as a layout route
}

export default function AppShell({ children }: AppShellProps) {
  const { sidebarCollapsed } = useAppStore();

  const content = children ?? <Outlet />; // âœ… wrapper or layout-route compatible

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed sidebar so the margin-left shift is stable */}
      <aside className="fixed inset-y-0 left-0">
        <Sidebar />
      </aside>

      {/* Shift main area based on sidebar state */}
      <div
        className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}
      >
        <header>
          <TopBar />
        </header>

        <main id="main" role="main" className="p-6">
          {/* Prevent suspense-y children from blanking the shell */}
          <Suspense fallback={<div className="text-sm text-muted-foreground">Loadingâ€¦</div>}>
            {content}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
