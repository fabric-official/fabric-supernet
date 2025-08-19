export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const API_BASE = import.meta.env.VITE_API_BASE || "";

function headers() {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const token = localStorage.getItem("auth_token");
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

async function request<T>(path: string, method: HttpMethod = "GET", body?: any): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try { const j = await res.json(); if (j?.message) msg = j.message; } catch {}
    throw new Error(`${res.status} ${msg}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? await res.json() : (await res.text() as unknown as T);
}

export const http = {
  get:  <T>(p: string) => request<T>(p, "GET"),
  post: <T>(p: string, body?: any) => request<T>(p, "POST", body),
  put:  <T>(p: string, body?: any) => request<T>(p, "PUT", body),
  patch:<T>(p: string, body?: any) => request<T>(p, "PATCH", body),
  del:  <T>(p: string) => request<T>(p, "DELETE"),
};
