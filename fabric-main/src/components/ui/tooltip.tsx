import * as React from "react";

// Minimal placeholders to satisfy { TooltipProvider } imports.
// Replace with your real shadcn/ui tooltip when ready.
export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function TooltipTrigger({ children }: { children: React.ReactNode }) {
  return <span>{children}</span>;
}

export function TooltipContent({ children }: { children: React.ReactNode }) {
  // keep simple; no portal/popover behavior, just render content inline
  return <div>{children}</div>;
}