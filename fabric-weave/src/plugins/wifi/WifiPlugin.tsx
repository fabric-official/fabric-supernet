import { DashboardPlugin } from "@/types/plugin";
import { Wifi } from "lucide-react";
import { WifiPage } from "./components/WifiPage";
import { WifiOverviewWidget } from "./components/WifiOverviewWidget";

export const WifiPlugin: DashboardPlugin = {
  id: "wifi",
  title: "Wi-Fi Networks", 
  route: "/wifi",
  icon: Wifi,
  page: WifiPage,
  widgets: [WifiOverviewWidget],
  permissions: ["wifi.view"],
};