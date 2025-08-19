import { Boxes as Store } from "lucide-react";
import { AppStorePage } from "./components/AppStorePage";

/** minimal local copy to avoid type import issues */
type DashboardPlugin = {
  id: string; title: string; route: string; icon?: any; page: any; widgets?: any[]; permissions?: string[];
};

export const AppStorePlugin: DashboardPlugin = {
  id: "app-store",
  title: "App Store",
  route: "/store",
  icon: Store,
  page: AppStorePage,
  widgets: [],
  permissions: [],
};
