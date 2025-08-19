import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/core/store";
import { useCtx } from "@/core/utils/ctx";
import { plugins } from "../../../plugin.config";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Menu, X } from "lucide-react";
import logoUrl from "@/assets/fabric-logo.png";

type AnyPlugin = {
  title: string;
  icon?: any;
  // Some plugins expose a single route, others expose an array:
  route?: string;
  routes?: Array<{ path: string; title?: string }>;
  permissions?: string[];
};

function primaryHref(p: AnyPlugin): string {
  // Prefer explicit p.route, else first route path, else overview
  return p.route ?? p.routes?.[0]?.path ?? "/overview";
}

export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const { rbac } = useCtx();
  const location = useLocation();

  const accessiblePlugins = (plugins as AnyPlugin[]).filter((p) => {
    if (!p.permissions || p.permissions.length === 0) return true;
    return p.permissions.some((perm) => rbac.hasPermission(perm));
  });

  const navigation = [
    { name: "Overview", href: "/overview", icon: LayoutDashboard },
    ...accessiblePlugins.map((p) => ({
      name: p.title,
      href: primaryHref(p),
      icon: p.icon,
    })),
  ];

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-full bg-card border-r border-border transition-all duration-300 z-50",
        sidebarCollapsed ? "w-24" : "w-[17rem]"
      )}
    >
      <div className="flex h-24 items-center justify-between px-4 border-b border-border">
        <Link to="/overview" className="inline-flex items-center gap-2 min-w-0">
          {!sidebarCollapsed ? (
            <img
              src={logoUrl}
              alt="Fabric 1.0"
              className="h-20 w-auto dark:brightness-110 select-none shrink-0"
              draggable={false}
            />
          ) : (
            <img
              src={logoUrl}
              alt="Fabric"
              className="h-14 w-14 object-contain dark:brightness-110 select-none shrink-0"
              draggable={false}
            />
          )}
          <span className="sr-only">Fabric</span>
        </Link>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="text-mutedForeground hover:text-foreground"
        >
          {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
        </Button>
      </div>

      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== "/overview" && location.pathname.startsWith(item.href));
          const IconComponent = item.icon as any;

          return (
            <Link key={item.href} to={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  sidebarCollapsed ? "px-2" : "px-3",
                  isActive && "bg-trust/10 text-trust hover:bg-trust/20"
                )}
              >
                {IconComponent && (
                  <IconComponent
                    size={20}
                    className={cn("shrink-0", !sidebarCollapsed && "mr-3")}
                  />
                )}
                {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
              </Button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
