import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between pb-6", className)}>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="text-mutedForeground">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center space-x-2">{children}</div>}
    </div>
  );
}