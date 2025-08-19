import { DashboardPlugin } from "@/types/plugin";
import { Monitor } from "lucide-react";
import { DevicesPage } from "./components/DevicesPage";
import { DevicesOverviewWidget } from "./components/DevicesOverviewWidget";

export const DevicesPlugin: DashboardPlugin = {
  id: "devices",
  title: "Devices",
  route: "/devices",
  icon: Monitor,
  page: DevicesPage,
  widgets: [DevicesOverviewWidget],
  permissions: ["devices.view"],
};