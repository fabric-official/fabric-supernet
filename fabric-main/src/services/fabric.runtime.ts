// src/services/fabric.runtime.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

const DEFAULT_TIMEOUT_MS = 20_000;

function withTimeout<T>(p: Promise<T>, ms = DEFAULT_TIMEOUT_MS, label = "bridge timed out"): Promise<T> {
  let t: any;
  const timer = new Promise<never>((_, reject) => {
    t = setTimeout(() => reject(new Error(label)), ms);
  });
  return Promise.race([p.finally(() => clearTimeout(t)), timer]) as Promise<T>;
}

function getBaseUrl(): string {
  const env = (import.meta as any)?.env?.VITE_RUNTIME_BASEURL;
  return typeof env === "string" && env.length ? env : "http://127.0.0.1:47615";
}

function computeCaps(channel: string): string[] {
  if (channel === "export.artifact") return ["export.artifact"];

  if (channel.startsWith("wifi.")) {
    const op = channel.split(".")[1];
    if (op === "scan") return ["wifi.scan"];
    if (op === "join") return ["wifi.join"];
  }

  if (channel.startsWith("git.")) {
    const op = channel.split(".")[1];
    if (op === "pull") return ["git.pull"];
    if (op === "push") return ["git.push"];
    if (op === "read") return ["git.read"];
    if (op === "write") return ["git.write"];
  }

  if (channel.startsWith("device.")) {
    const op = channel.split(".")[1];
    if (op === "list") return ["device.list"];
    if (op === "enroll") return ["device.enroll"];
  }

  if (channel.startsWith("agent.")) return [channel];
  if (channel.startsWith("license.")) return [channel];
  if (channel.startsWith("policy.")) return [channel];
  if (channel.startsWith("attest.")) return [channel];

  return [];
}

/** Primary bridge entrypoint. */
export async function invoke(
  channel: string,
  data?: any,
  extraCaps: string[] = [],
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<any> {
  // Preferred: app bridge with capabilities
  if (window.fabric?.invoke) {
    const base = computeCaps(channel);
    const caps = Array.from(new Set([...base, ...extraCaps]));
    return withTimeout(window.fabric.invoke(channel, data, caps), timeoutMs, `${channel} timed out`);
  }

  const g = window as any;

  // wifi.scan (fab or REST)
  if (channel === "wifi.scan") {
    if (g.fab?.scanWifi) {
      return withTimeout(g.fab.scanWifi(), 8_000, "wifi.scan timed out");
    }
    const r = await withTimeout(fetch(`${getBaseUrl()}/wifi/scan`), 8_000, "wifi.scan timed out");
    if (!r.ok) throw new Error(`wifi.scan HTTP ${r.status}`);
    return r.json();
  }

  // wifi.join (fab or REST)
  if (channel === "wifi.join") {
    const { ssid, psk } = data || {};
    if (!ssid) throw new Error("ssid required");
    if (g.fab?.joinWifi) {
      return withTimeout(g.fab.joinWifi({ ssid, psk }), 15_000, "wifi.join timed out");
    }
    const r = await withTimeout(
      fetch(`${getBaseUrl()}/wifi/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ssid, psk }),
      }),
      15_000,
      "wifi.join timed out"
    );
    if (!r.ok) throw new Error(`wifi.join HTTP ${r.status}`);
    return r.json();
  }

  // device.*
  if (channel === "device.list" && g.fab?.listDevices) {
    return withTimeout(g.fab.listDevices(), 8_000, "device.list timed out");
  }
  if (channel === "device.enroll" && g.fab?.enrollDevice) {
    return withTimeout(g.fab.enrollDevice(data || {}), 8_000, "device.enroll timed out");
  }

  // policy.*, attest.*
  if (channel === "policy.verify" && g.fab?.verifyPolicy) {
    return withTimeout(g.fab.verifyPolicy(data || {}), 15_000, "policy.verify timed out");
  }
  if (channel === "attest.verify" && g.fab?.verifyAttestation) {
    return withTimeout(g.fab.verifyAttestation(data || {}), 15_000, "attest.verify timed out");
  }

  // agent.*
  if (channel.startsWith("agent.")) {
    const method =
      channel === "agent.start" ? "startAgent" :
      channel === "agent.stop" ? "stopAgent" :
      channel === "agent.update" ? "updateAgent" : "";
    if (method && g.fab?.[method]) {
      return withTimeout(g.fab[method](data || {}), 10_000, `${channel} timed out`);
    }
  }

  // license.*
  if (channel === "license.activate" && g.fab?.activateLicense) {
    return withTimeout(g.fab.activateLicense(data || {}), 15_000, "license.activate timed out");
  }

  // policy.get
  if (channel === "policy.get" && g.fab?.getPolicy) {
    return withTimeout(g.fab.getPolicy(data || {}), 8_000, "policy.get timed out");
  }

  throw new Error("Fabric bridge not available for: " + channel);
}

/* Optional convenience wrappers */
export async function wifiScan(): Promise<{ networks: any[] } | any[]> {
  const out = await invoke("wifi.scan");
  if (Array.isArray(out)) return out;
  if (Array.isArray(out?.networks)) return out;
  if (Array.isArray(out?.ssids)) return { networks: out.ssids.map((ssid: string) => ({ ssid })) };
  return { networks: [] };
}

export async function wifiJoin(ssid: string, psk?: string): Promise<{ success: boolean; error?: string }> {
  return invoke("wifi.join", { ssid, psk });
}

