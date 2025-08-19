import { DashboardPlugin } from "@/types/plugin";
import { Wallet } from "lucide-react";
import { TreasuryPage } from "./components/TreasuryPage";
import { TreasuryOverviewWidget } from "./components/TreasuryOverviewWidget";

export const TreasuryPlugin: DashboardPlugin = {
  id: "treasury",
  title: "Treasury",
  route: "/treasury",
  icon: Wallet,
  page: TreasuryPage,
  widgets: [TreasuryOverviewWidget],
  permissions: ["treasury.view"],
};