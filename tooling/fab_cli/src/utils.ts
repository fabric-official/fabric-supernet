import axios, { AxiosInstance } from "axios";
import fs from "fs-extra";
import path from "node:path";
import yaml from "js-yaml";
import chalk from "chalk";
import winston from "winston";

export type FabConfig = {
  registryBase: string;
  hmacKey?: string;
  runtimeKube?: { kubeconfig?: string, namespace?: string };
  economyBase?: string;
  provenanceLedger?: string;
  tls?: { cert?: string; key?: string; ca?: string };
  principal?: string;
};

export function loadConfig(): FabConfig {
  // allow FAB_CONFIG env path, else ./fabric.config.yaml
  const p = process.env.FAB_CONFIG || path.resolve(process.cwd(), "fabric.config.yaml");
  if (fs.existsSync(p)) return yaml.load(fs.readFileSync(p, "utf-8")) as FabConfig;
  // fallback to env vars
  return {
    registryBase: process.env.FABRIC_REGISTRY_BASE || "http://localhost:8090",
    hmacKey: process.env.FABRIC_HMAC_KEY,
    runtimeKube: { namespace: process.env.FABRIC_NS || "fabric" },
    economyBase: process.env.ECONOMY_BASE,
    provenanceLedger: process.env.PROVENANCE_LEDGER_URL,
    tls: { cert: process.env.TLS_CERT, key: process.env.TLS_KEY, ca: process.env.TLS_CA },
    principal: process.env.FABRIC_PRINCIPAL
  };
}

export function makeHttp(c?: FabConfig): AxiosInstance {
  const cfg = c ?? loadConfig();
  const instance = axios.create({
    baseURL: cfg.registryBase,
    timeout: 30000,
    httpsAgent: undefined // rely on system trust/mTLS via sidecar or reverse proxy
  });
  instance.interceptors.request.use((req) => {
    if (cfg.principal) (req.headers as any)["x-fabric-principal"] = cfg.principal;
    return req;
  });
  return instance;
}

export function hmacHex(key: string, data: Buffer | string): string {
  const crypto = await import("node:crypto");
  const h = crypto.createHmac("sha256", key);
  h.update(data);
  return h.digest("hex");
}

export const log = winston.createLogger({
  level: "info",
  transports: [new winston.transports.Console({ format: winston.format.simple() })]
});

export async function fileSha256(p: string): Promise<string> {
  const crypto = await import("node:crypto");
  const hash = crypto.createHash("sha256");
  const stream = fs.createReadStream(p);
  return await new Promise((resolve, reject) => {
    stream.on("data", (d) => hash.update(d));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}
