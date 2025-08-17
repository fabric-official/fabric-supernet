import * as http from "http";
import * as https from "https";
import * as url from "url";
import * as fs from "fs";
import * as path from "path";
import { spawn, ChildProcess } from "child_process";

type Cfg = {
  baseURL: string;
  healthPath?: string;
  routes?: { [k: string]: string };
  spawn?: { cmd: string; args?: string[]; cwd?: string; env?: Record<string,string>; waitHealthMs?: number; };
};

const cfgPath = path.join(process.cwd(),"config","supernet.client.json");
let cfg: Cfg = { baseURL: "http://127.0.0.1:8891", healthPath: "/healthz", routes: { "agent.start":"/v1/agent/start", "agent.publish":"/v1/agent/publish", "compile":"/v1/compile" } };
try { cfg = { ...cfg, ...JSON.parse(fs.readFileSync(cfgPath,"utf8")) }; } catch {}

let child: ChildProcess | null = null;

function fetchJson(method: "GET"|"POST", p: string, body?: any, timeoutMs=20000): Promise<any> {
  return new Promise((resolve,reject)=>{
    const base = new url.URL(cfg.baseURL);
    const isHttps = base.protocol === "https:";
    const client = isHttps? https: http;
    const opt: http.RequestOptions = {
      hostname: base.hostname, port: base.port || (isHttps?443:80), path: p,
      method, headers: { "Content-Type":"application/json" }, timeout: timeoutMs
    };
    const req = client.request(opt, res=>{
      let d=""; res.setEncoding("utf8");
      res.on("data",c=>d+=c); res.on("end",()=>{ try{ resolve(d?JSON.parse(d):{}) } catch(e){ reject(new Error("bad json: "+e)) }});
    });
    req.on("error",reject);
    if(body!==undefined) req.write(JSON.stringify(body));
    req.end();
  });
}

async function healthy(): Promise<boolean> {
  try { const hp = cfg.healthPath || "/healthz"; const r = await fetchJson("GET", hp); return r && (r.ok===true || r.status==="ok" || r.healthy===true); }
  catch { return false; }
}

async function ensureStarted(): Promise<void> {
  if(await healthy()) return;
  if(!cfg.spawn) throw new Error("SuperNet not reachable and no spawn config present");
  if(child && child.exitCode===null) {
    // still starting?
  } else {
    child = spawn(cfg.spawn.cmd, cfg.spawn.args||[], { cwd: cfg.spawn.cwd||process.cwd(), env: { ...process.env, ...(cfg.spawn.env||{}) }, stdio: "inherit" });
  }
  const deadline = Date.now() + (cfg.spawn.waitHealthMs ?? 30000);
  while(Date.now() < deadline){
    if(await healthy()) return;
    await new Promise(r=>setTimeout(r,500));
  }
  throw new Error("SuperNet failed health check");
}

export async function agentStart(payload:any): Promise<any> {
  await ensureStarted();
  const p = (cfg.routes?.["agent.start"]) || "/v1/agent/start";
  return fetchJson("POST", p, payload ?? {});
}
export async function agentPublish(payload:any): Promise<any> {
  await ensureStarted();
  const p = (cfg.routes?.["agent.publish"]) || "/v1/agent/publish";
  return fetchJson("POST", p, payload ?? {});
}
export async function compile(payload:{sourcePath?:string; source?:string; target?:string}): Promise<any> {
  await ensureStarted();
  let body = payload || {};
  if(payload?.sourcePath && !payload.source){
    const sp = path.resolve(payload.sourcePath);
    body = { ...payload, source: fs.readFileSync(sp,"utf8") };
  }
  const p = (cfg.routes?.["compile"]) || "/v1/compile";
  return fetchJson("POST", p, body);
}
export async function supernetHealth(){ return (await healthy())? { ok:true }: { ok:false }; }