import { StatCard } from "@/core/ui/StatCard";
import { Wallet } from "lucide-react";
import { mockTreasuryData } from "@/core/api/client";

export function TreasuryOverviewWidget() {
  const currentBalance = mockTreasuryData[mockTreasuryData.length - 1]?.balance || 0;
  const previousBalance = mockTreasuryData[mockTreasuryData.length - 2]?.balance || 0;
  const change = currentBalance - previousBalance;
  const changePercent = previousBalance > 0 ? ((change / previousBalance) * 100) : 0;

  return (
    <StatCard
      title="Treasury Balance"
      value={`$${currentBalance.toLocaleString()}`}
      icon={<Wallet size={24} />}
      color="tutorial"
      trend={{
        value: Math.abs(changePercent),
        isPositive: change > 0,
      }}
    />
  );
}