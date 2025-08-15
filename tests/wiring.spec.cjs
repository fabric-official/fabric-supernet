/**
 * Wiring/Hardening Test — fails RED if any invariant is missing.
 * Run with:  npx mocha tests/wiring.spec.cjs
 */
const fs = require("fs");
const path = require("path");
const { expect } = require("chai");

function read(p) {
  if (!fs.existsSync(p)) throw new Error(`Missing file: ${p}`);
  return fs.readFileSync(p, "utf8");
}
function has(re, text, msg) {
  if (!re.test(text)) throw new Error(msg);
}

describe("SuperNet wiring + hardening", function () {
  this.timeout(30000);

  it("Electron main.ts is hardened", () => {
    const p = path.join("electron-src","main.ts");
    const txt = read(p);
    has(/contextIsolation:\s*true/, txt, "contextIsolation:true missing");
    has(/nodeIntegration:\s*false/, txt, "nodeIntegration:false missing");
    has(/sandbox:\s*true/, txt, "sandbox:true missing");
    has(/setWindowOpenHandler\(\s*\(\)\s*=>\s*\(\{\s*action:\s*["']deny["']/, txt, "window.open DENY missing");
    has(/will-navigate.*=>\s*e\.preventDefault/, txt, "will-navigate preventDefault missing");
    has(/Content-Security-Policy/, txt, "CSP header not set");
  });

  it("Electron preload.ts only exposes a single safe API", () => {
    const p = path.join("electron-src","preload.ts");
    const txt = read(p);
    has(/contextBridge\.exposeInMainWorld/, txt, "preload does not expose via contextBridge");
    has(/ipcRenderer\.invoke\(\s*["']fabric:invoke["']/, txt, "preload must funnel through fabric:invoke only");
  });

  it("IPC registry has allowlist + capability gating", () => {
    const p = path.join("electron-src","main_ipc_registry.ts");
    const txt = read(p);
    has(/ALLOWED_INVOKE\s*=\s*new Set/, txt, "ALLOWED_INVOKE missing");
    has(/"plugin:list"/, txt, "plugin:list not allowed");
    has(/"plugin:get"/, txt, "plugin:get not allowed");
    has(/"env:version"/, txt, "env:version not allowed");
    has(/function\s+requireCapability\(/, txt, "requireCapability missing");
  });

  it("React PluginManager exports + gates correctly", () => {
    const p = path.join("fabric-main","src","services","PluginManager.ts");
    const txt = read(p);
    has(/export function registerPlugin/, txt, "registerPlugin export missing");
    has(/export function listPlugins/, txt, "listPlugins export missing");
    has(/export function loadPlugin/, txt, "loadPlugin export missing");
    has(/Missing capability to load plugin/, txt, "capability gating message missing");
    has(/registerPlugin\(\s*\{\s*id:\s*["']backboard["']/, txt, "Backboard bootstrap missing");
  });

  it("Routes + 404 are wired", () => {
    const app = read(path.join("fabric-main","src","App.tsx"));
    const nf  = read(path.join("fabric-main","src","pages","NotFound.tsx"));
    has(/Route\s+path=["']\/plugins\/:id["']/, app, "/plugins/:id route missing");
    has(/window\.location\.hash\s*\|\|\s*window\.location\.pathname/, nf, "hash-aware 404 missing");
  });

  it("Vite config is hardened (CSP + fs sandbox)", () => {
    const vite = read(path.join("fabric-main","vite.config.ts"));
    has(/Content-Security-Policy/, vite, "CSP header missing in dev server");
    has(/fs:\s*\{\s*strict:\s*true/, vite, "Vite fs.strict true missing");
  });

  it("Build artifacts exist (UI + Electron)", () => {
    // UI dist
    const uiIndex = path.join("fabric-main","dist","index.html");
    if (!fs.existsSync(uiIndex)) {
      throw new Error("fabric-main/dist/index.html missing — run UI build");
    }
    // Electron dist
    const emain = path.join("dist-electron","main.cjs");
    const epre  = path.join("dist-electron","preload.cjs");
    if (!fs.existsSync(emain) || !fs.existsSync(epre)) {
      throw new Error("dist-electron/*.cjs missing — run Electron build");
    }
  });
});
