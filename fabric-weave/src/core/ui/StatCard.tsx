import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'ignite' | 'creator' | 'trust' | 'vision' | 'tutorial';
  className?: string;
}

export function StatCard({ title, value, icon, trend, color, className }: StatCardProps) {
  const colorStyles = {
    ignite: 'border-l-4 border-l-ignite',
    creator: 'border-l-4 border-l-creator',
    trust: 'border-l-4 border-l-trust',
    vision: 'border-l-4 border-l-vision',
    tutorial: 'border-l-4 border-l-tutorial',
  };

  return (
    <Card className={cn("p-6", color && colorStyles[color], className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-mutedForeground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {trend && (
            <div className={cn(
              "flex items-center text-sm",
              trend.isPositive ? "text-tutorial" : "text-ignite"
            )}>
              <span>{trend.isPositive ? "â†—" : "â†˜"}</span>
              <span className="ml-1">{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="text-mutedForeground">{icon}</div>
        )}
      </div>
    </Card>
  );
}