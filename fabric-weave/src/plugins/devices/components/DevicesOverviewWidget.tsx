import { StatCard } from "@/core/ui/StatCard";
import { Monitor } from "lucide-react";
import { mockDevices } from "@/core/api/client";

export function DevicesOverviewWidget() {
  const onlineDevices = mockDevices.filter(d => d.status === 'online').length;
  const totalDevices = mockDevices.length;

  return (
    <StatCard
      title="Network Devices"
      value={`${onlineDevices}/${totalDevices}`}
      icon={<Monitor size={24} />}
      color="trust"
      trend={{
        value: 12,
        isPositive: true,
      }}
    />
  );
}