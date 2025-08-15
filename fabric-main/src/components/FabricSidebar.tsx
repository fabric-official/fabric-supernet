// Fabric Dashboard Sidebar with Logo
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Shield, 
  HardDrive, 
  Wifi, 
  FileText, 
  Settings, 
  Activity,
  Home
} from 'lucide-react';

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
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Operations", url: "/ops", icon: Activity },
  { title: "Devices", url: "/ops/devices", icon: HardDrive },
  { title: "Network", url: "/ops/network", icon: Wifi },
  { title: "Compliance", url: "/ops/compliance", icon: Shield },
  { title: "Licenses", url: "/ops/licenses", icon: Settings },
  { title: "Audit Logs", url: "/ops/logs", icon: FileText },
];

export function FabricSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  };

  const getNavClasses = (path: string) =>
    isActive(path) 
      ? "bg-primary/10 text-primary border-r-2 border-primary font-medium" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  return (
    <Sidebar
      className={`border-r border-border transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-border bg-card">
        <div className="flex items-center justify-center p-6">
          {collapsed ? (
            // Show just the hexagon icon when collapsed
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">F</span>
            </div>
          ) : (
            // Show full logo when expanded
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/1996c29b-252a-4194-a8de-f6ad9026d360.png" 
                alt="Fabric 1.0"
                className="h-16 w-auto max-w-full"
              />
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="px-6 pb-4">
            <p className="text-sm text-muted-foreground text-center font-medium">
              SuperNet Backboard
            </p>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="transition-colors">
                    <NavLink 
                      to={item.url} 
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${getNavClasses(item.url)}`}
                      title={collapsed ? item.title : undefined}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && (
                        <span className="text-sm font-medium">{item.title}</span>
                      )}
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
            <div className={`px-3 py-2 ${collapsed ? "px-2" : ""}`}>
              <div className={`flex items-center space-x-2 text-xs ${
                collapsed ? "justify-center" : ""
              }`}>
                <div className="w-2 h-2 bg-secure rounded-full animate-pulse"></div>
                {!collapsed && (
                  <span className="text-muted-foreground">Secure</span>
                )}
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}