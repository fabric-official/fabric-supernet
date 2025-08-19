import { now, writeJSON, sleep } from "./lib/helpers.mjs";
import http from "node:http"; import { URL } from "node:url";
async function probe(url){ return await new Promise((resolve)=>{ try{ const u = new URL(url); const req = http.get({hostname:u.hostname, port:u.port||80, path:u.pathname, timeout:2000}, res=> resolve({ok: res.statusCode && res.statusCode<500, status: res.statusCode})); req.on('error',()=>resolve({ok:false})); req.on('timeout',()=>{ req.destroy(); resolve({ok:false}); }); }catch{ resolve({ok:false}); } }); }
async function main(){ const endpoint = process.env.SI_WATCH_URL || "http://127.0.0.1:8080/healthz"; const induce = process.env.INDUCE_FAIL === "1"; const oneShot = process.argv.includes("--one-shot"); const status = { started_at: now(), ok:null, checks: [] };
  const runCheck = async ()=>{ const r = induce ? {ok:false, status:503} : await probe(endpoint); status.checks.push({ ts: now(), ok: r.ok, status: r.status||null }); status.ok = r.ok; await writeJSON("./out/health.json", { ok: r.ok, status: r.status || null, endpoint, ts: now() }); await writeJSON("./artifacts/status.json", status); };
  if(oneShot){ await runCheck(); console.log("[watcher] one-shot", status.ok ? "ok" : "fail"); process.exit(status.ok?0:5); } else { while(true){ await runCheck(); await sleep(1500); } }
}
main().catch(e=>{ console.error(e); process.exit(1); });
