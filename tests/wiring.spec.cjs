const fs = require("fs");
const path = require("path");
const { expect } = require("chai");
const REQS = JSON.parse(fs.readFileSync(path.join(__dirname,"wiring.requirements.json"),"utf8"));
const r = (p)=>path.join.apply(path, p);

function read(p){ if(!fs.existsSync(p)) throw new Error(`Missing file: ${p}`); return fs.readFileSync(p,"utf8"); }
function must(re, txt, msg){ if(!re.test(txt)) throw new Error(msg); }
function mustNot(re, txt, msg){ if(re.test(txt)) throw new Error(msg); }

describe("SUPER HARSH — Wiring & Hardening", function(){
  this.timeout(30000);

  it("Electron main.ts hardened", ()=>{
    const t = read(r(["electron-src","main.ts"]));
    must(/contextIsolation:\s*true/, t, "contextIsolation:true missing");
    must(/nodeIntegration:\s*false/, t, "nodeIntegration:false missing");
    must(/sandbox:\s*true/, t, "sandbox:true missing");
    must(/setWindowOpenHandler\(\s*\(\)\s*=>\s*\(\{\s*action:\s*['"]deny['"]/, t, "window.open DENY missing");
    must(/will-navigate.*=>\s*e\.preventDefault/, t, "will-navigate preventDefault missing");
    must(/Content-Security-Policy/, t, "CSP header configuration missing");
  });

  it("Preload exposes only a single safe API", ()=>{
    const t = read(r(["electron-src","preload.ts"]));
    must(/contextBridge\.exposeInMainWorld/, t, "contextBridge expose missing");
    must(/ipcRenderer\.invoke\(\s*['"]fabric:invoke['"]/, t, "must funnel through fabric:invoke");
    mustNot(/ipcRenderer\.(on|send)\(/, t, "no event/send APIs allowed from preload");
  });

  it("IPC registry allowlist + capability gating exact", ()=>{
    const t = read(r(["electron-src","main_ipc_registry.ts"]));
    must(/ALLOWED_INVOKE\s*=\s*new Set/, t, "ALLOWED_INVOKE missing");
    REQS.ipcAllowlist.forEach(ch=>must(new RegExp(`['"]${ch}['"]`), t, `Allowlist missing: ${ch}`));
    must(/function\s+requireCapability\(/, t, "requireCapability missing");
    Object.entries(REQS.capabilityMap).forEach(([ch,caps])=>{
      if(caps.length){
        const re = new RegExp(`${ch.replace(/[:/]/g,"[:/]")}[^]*\\[\\s*${caps.map(c=>`['"]${c}['"]`).join("\\s*,\\s*")}\\s*\\]`,"m");
        must(re,t,`Channel ${ch} must require capabilities ${caps.join(", ")}`);
      }
    });
  });

  it("PluginManager exports + capability enforcement + Backboard bootstrap", ()=>{
    const t = read(r(["fabric-main","src","services","PluginManager.ts"]));
    must(/export function registerPlugin/, t, "registerPlugin export missing");
    must(/export function listPlugins/, t, "listPlugins export missing");
    must(/export function loadPlugin/, t, "loadPlugin export missing");
    must(/Missing capability to load plugin/, t, "capability error text missing");
    must(/registerPlugin\(\s*\{\s*id:\s*['"]backboard['"]/, t, "Backboard bootstrap missing");
  });

  it("Routing & 404", ()=>{
    const a = read(r(["fabric-main","src","App.tsx"]));
    const n = read(r(["fabric-main","src","pages","NotFound.tsx"]));
    must(/Route\s+path=["']\/plugins\/:id["']/, a, "/plugins/:id route missing");
    must(/window\.location\.hash\s*\|\|\s*window\.location\.pathname/, n, "hash-aware 404 missing");
  });

  it("Vite dev server CSP + fs.strict", ()=>{
    const t = read(r(["fabric-main","vite.config.ts"]));
    REQS.viteCSPMustInclude.forEach(dir=>must(new RegExp(dir.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")), t, `CSP missing: ${dir}`));
    must(/fs:\s*\{\s*strict:\s*true/, t, "Vite fs.strict true missing");
  });

  it("No forbidden patterns in src/electron-src", ()=>{
    const { globSync } = require("glob");
    const files = globSync("{electron-src,fabric-main/src}/**/*.*",{nodir:true,ignore:["**/*.map","**/*.d.ts"]});
    const bad = [];
    for(const f of files){
      const txt = fs.readFileSync(f,"utf8");
      for(const p of REQS.forbiddenPatterns){ const re=new RegExp(p); if(re.test(txt)) bad.push(`${f}: ${p}`); }
    }
    if(bad.length) throw new Error("Forbidden patterns:\n"+bad.join("\n"));
  });

  it("Build artifacts exist", ()=>{
    const ui = r(["fabric-main","dist","index.html"]);
    const em = r(["dist-electron","main.cjs"]);
    const ep = r(["dist-electron","preload.cjs"]);
    if(!fs.existsSync(ui)) throw new Error("fabric-main/dist/index.html missing");
    if(!fs.existsSync(em) || !fs.existsSync(ep)) throw new Error("dist-electron/*.cjs missing");
  });
});
