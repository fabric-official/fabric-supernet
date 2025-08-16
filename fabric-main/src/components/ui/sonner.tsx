import * as React from "react";

// Placeholder Sonner Toaster + toast() no-op. Replace with sonner package if desired.
export function Toaster(): JSX.Element | null {
  return null;
}
export const toast = (...args: any[]) => {
  try { console.debug("[toast]", ...args); } catch {}
};