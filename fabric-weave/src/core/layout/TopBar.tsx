import { Button } from "@/components/ui/button";
import { useCtx } from "@/core/utils/ctx";
import { useAuth } from "@/core/auth/AuthProvider";
import { Moon, Sun, Bell, User, LogOut } from "lucide-react";
import bannerUrl from "@/assets/supernet-banner.png"; // <-- your banner

export function TopBar() {
  const { theme } = useCtx();
  const { user, profile, signOut } = useAuth();

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        {/* banner instead of text */}
        <img
          src={bannerUrl}
          alt="Fabric Supernet Dashboard"
          className="h-10 w-auto object-contain dark:brightness-110 select-none"
          draggable={false}
        />
      </div>

      <div className="flex items-center space-x-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={theme.toggle}
          className="text-mutedForeground hover:text-foreground"
        >
          {theme.isDark ? <Sun size={20} /> : <Moon size={20} />}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-mutedForeground hover:text-foreground"
        >
          <Bell size={20} />
        </Button>

        <div className="flex items-center space-x-2 text-sm">
          <User size={16} className="text-mutedForeground" />
          <span className="text-foreground">
            {profile?.full_name || user?.email || "User"}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="text-mutedForeground hover:text-foreground"
        >
          <LogOut size={20} />
        </Button>
      </div>
    </header>
  );
}
