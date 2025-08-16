// Fabric Dashboard Sidebar with Logo (robust / provider-safe)
import React from "react";
import { NavLink } from "react-router-dom";
import {
  Shield,
  HardDrive,
  Wifi,
  FileText,
  Settings,
  Activity,
  Home,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  // NOTE: no useSidebar() â€” we avoid the crash when provider is missing
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home, end: true },
  { title: "Operations", url: "/ops", icon: Activity },
  { title: "Devices", url: "/ops/devices", icon: HardDrive },
  { title: "Network", url: "/ops/network", icon: Wifi },
  { title: "Compliance", url: "/ops/compliance", icon: Shield },
  { title: "Licenses", url: "/ops/licenses", icon: Settings },
  { title: "Audit Logs", url: "/ops/logs", icon: FileText },
];

// Helper to merge class names
function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function FabricSidebar() {
  return (
    <Sidebar
      collapsible="icon"
      className={cx(
        // width & transitions driven by data-state so we don't need the hook
        "border-r border-border transition-all duration-300",
        "data-[state=collapsed]:w-16 data-[state=expanded]:w-64"
      )}
    >
      {/* Header / Logo */}
      <SidebarHeader className="border-b border-border bg-[hsl(var(--card))]">
        <div className="flex items-center justify-center p-6">
          {/* Collapsed logo (shown when collapsed) */}
          <div className="hidden data-[state=collapsed]:flex w-10 h-10 rounded-lg items-center justify-center
                          bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-bold text-lg">
            F
          </div>

          {/* Expanded logo (hidden when collapsed) */}
          <div className="data-[state=collapsed]:hidden flex items-center space-x-3">
            <img
              src="/lovable-uploads/1996c29b-252a-4194-a8de-f6ad9026d360.png"
              alt="Fabric 1.0"
              className="h-16 w-auto max-w-full"
            />
          </div>
        </div>

        {/* Subtitle (expanded only) */}
        <div className="data-[state=collapsed]:hidden px-6 pb-4">
          <p className="text-sm text-muted-foreground text-center font-medium">
            SuperNet Backboard
          </p>
        </div>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))]">
        <SidebarGroup>
          <SidebarGroupLabel className="data-[state=collapsed]:sr-only">
            Navigation
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="transition-colors">
                    <NavLink
                      to={item.url}
                      // `end` prevents "/" from being active on every route
                      {...(item.end ? { end: true } : {})}
                      className={({ isActive }) =>
                        cx(
                          "flex items-center space-x-3 px-3 py-2 rounded-lg transition-all",
                          isActive
                            ? "bg-primary/10 text-primary border-r-2 border-primary font-medium"
                            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                        )
                      }
                      title={item.title}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {/* Hide labels when collapsed via data-state */}
                      <span className="data-[state=collapsed]:hidden text-sm font-medium">
                        {item.title}
                      </span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Security Status Indicator */}
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="px-3 py-2 data-[state=collapsed]:px-2">
              <div className="flex items-center space-x-2 text-xs data-[state=collapsed]:justify-center">
                {/* Use your CSS variable directly for the dot color */}
                <div className="w-2 h-2 rounded-full animate-pulse bg-[hsl(var(--secure))]" />
                <span className="data-[state=collapsed]:hidden text-muted-foreground">
                  Secure
                </span>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
