import { StatCard } from "@/core/ui/StatCard";
import { Wifi } from "lucide-react";
import { mockWifiNetworks } from "@/core/api/client";

export function WifiOverviewWidget() {
  const totalConnected = mockWifiNetworks.reduce((sum, network) => sum + network.connected, 0);

  return (
    <StatCard
      title="Connected Devices"
      value={totalConnected}
      icon={<Wifi size={24} />}
      color="vision"
      trend={{
        value: 8,
        isPositive: true,
      }}
    />
  );
}