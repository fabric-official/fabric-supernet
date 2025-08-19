// src/plugins/supernet-core/src/index.ts  (no JSX anywhere)
import React from "react";
import type { DashboardPlugin, PluginRoute } from "@/types/plugin";
import { LayoutDashboard } from "lucide-react";

// ---------- API ----------
const rawBase =
  (typeof window !== "undefined" && (window as any).__API_BASE__) ||
  (import.meta as any).env?.VITE_SUPERNET_API ||
  (import.meta as any).env?.VITE_API_BASE ||
  "";
const API_BASE = String(rawBase).replace(/\/$/, "");

async function api<T>(p: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${p}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const text = await res.text();
  const body = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
  if (!res.ok) {
    const msg = typeof body === "string" ? body : body?.message || res.statusText;
    throw new Error(`HTTP ${res.status} ${msg}`.trim());
  }
  return body as T;
}

// ---------- Types ----------
export type SupernetAgent = {
  id: string;
  folder: string;
  category: "devices" | "wifi" | "drones" | "governor" | "other" | "module";
  version: string;
  description?: string;
  policy?: any;
  tags?: string[];
  author?: string;
  created_at?: string;
  serial_id?: string;
  signatures?: any;
  weights?: string | null;
};

// ---------- Lazy pages ----------
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Devices   = React.lazy(() => import("./pages/Devices"));
const Wifi      = React.lazy(() => import("./pages/Wifi"));
const Drones    = React.lazy(() => import("./pages/Drones"));
const Storage   = React.lazy(() => import("./pages/Storage"));
const Governor  = React.lazy(() => import("./pages/Governor"));

function suspense(node: React.ReactNode) {
  return React.createElement(React.Suspense, { fallback: null }, node);
}

// ---------- Routes (ReactNode elements only; matches PluginRoute) ----------
const routes: PluginRoute[] = [
  { path: "/supernet",          element: suspense(React.createElement(Dashboard)), meta: { title: "Supernet",  nav: { label: "Supernet", icon: LayoutDashboard } } },
  { path: "/supernet/devices",  element: suspense(React.createElement(Devices)),   meta: { title: "Devices",   nav: { label: "Devices" } } },
  { path: "/supernet/wifi",     element: suspense(React.createElement(Wifi)),      meta: { title: "Wi-Fi",     nav: { label: "Wi-Fi" } } },
  { path: "/supernet/drones",   element: suspense(React.createElement(Drones)),    meta: { title: "Drones",    nav: { label: "Drones" } } },
  { path: "/supernet/storage",  element: suspense(React.createElement(Storage)),   meta: { title: "Storage",   nav: { label: "Storage" } } },
  { path: "/supernet/governor", element: suspense(React.createElement(Governor)),  meta: { title: "Governor",  nav: { label: "Governor" } } },
];

// ---------- Plugin ----------
const SupernetCorePlugin: DashboardPlugin = {
  id: "supernet-core",
  title: "Supernet",
  icon: LayoutDashboard,
  routes,
};

export default SupernetCorePlugin;

// ---------- API helpers ----------
export async function fetchAgents(): Promise<SupernetAgent[]> {
  const data = await api<any>("/api/supernet/agents");
  return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
}
export async function fetchDevices(): Promise<SupernetAgent[]> {
  const data = await api<any>("/api/supernet/devices");
  return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
}
export async function fetchWifi(): Promise<SupernetAgent[]> {
  const data = await api<any>("/api/supernet/wifi/networks");
  return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
}
export async function fetchDrones(): Promise<SupernetAgent[]> {
  const data = await api<any>("/api/supernet/drones");
  return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
}
export async function fetchStorage(): Promise<any[]> {
  const data = await api<any>("/api/supernet/storage/mounts");
  return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
}
export async function fetchPolicies(): Promise<any[]> {
  const data = await api<any>("/api/supernet/governor/policies");
  return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
}







