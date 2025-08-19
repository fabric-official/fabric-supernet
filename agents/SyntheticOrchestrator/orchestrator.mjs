import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { createServer } from "node:http";
import { resolve } from "node:path";

function now(){ return new Date().toISOString(); }
function writeJSON(path, obj){
  const dir = resolve(path, "..");
  try { mkdirSync(dir, { recursive: true }); } catch {}
  writeFileSync(path, JSON.stringify(obj, null, 2), "utf-8");
}
function loadJSON(path){ return JSON.parse(readFileSync(path, "utf-8")); }
function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }
function sh(cmd){
  return new Promise((resolvePromise, reject) => {
    const shell = process.platform === "win32" ? "cmd" : "bash";
    const args = process.platform === "win32" ? ["/c", cmd] : ["-lc", cmd];
    const child = spawn(shell, args, { stdio: "pipe", env: process.env, cwd: process.cwd() });
    let out = "", err = "";
    child.stdout.on("data", d=> out += d.toString());
    child.stderr.on("data", d=> err += d.toString());
    child.on("close", code => code===0 ? resolvePromise({ok:true,out:out.trim()}) : reject({ok:false,out:out.trim(),err:err.trim(),code}));
  });
}

async function runTarget(t, policy, status){
  const phases = ["build","test","deploy"];
  for(const phase of phases){
    let attempt=0;
    while(true){
      attempt++;
      status.current = { target: t.id, phase, attempt, started_at: now() };
      try {
        const cmd = t[phase]?.cmd || "node -e \"console.log('ok')\"";
        await sh(cmd);
        status.events.push({ ts: now(), level: "info", target: t.id, msg: `${phase} ok` });
        break;
      } catch(e){
        status.events.push({ ts: now(), level: "error", target: t.id, msg: `${phase} failed`, detail: e.err || e.out || "" });
        if(attempt > (policy.max_retries ?? 0)) throw new Error(`${phase} failed after retries`);
        await sleep(policy.retry_backoff_ms ?? 1000);
      }
    }
  }
}

async function main(){
  const args = process.argv.slice(2);
  const planPath = args[args.indexOf("--plan")+1];
  const reportPath = args[args.indexOf("--report")+1];
  const servePortIdx = args.indexOf("--serve");
  const servePort = servePortIdx>-1 ? parseInt(args[servePortIdx+1],10) : null;

  const plan = loadJSON(planPath);
  const status = { agent:"SyntheticOrchestrator", started_at: now(), plan: plan.name, events:[], current:null, finished_at:null, ok:null };
  let server = null;
  if(servePort){
    server = createServer((req,res)=>{
      if(req.url==="/status"){ res.setHeader("Content-Type","application/json"); res.end(JSON.stringify(status)); }
      else { res.statusCode=404; res.end("not found"); }
    }).listen(servePort);
  }

  try{
    for(const t of plan.targets){ await runTarget(t, plan.policy||{}, status); }
    status.ok = true;
  }catch(e){ status.ok = false; status.events.push({ ts: now(), level:"fatal", msg: String(e.message||e) }); }
  status.finished_at = now();
  writeJSON(reportPath, status);

  if(!server) process.exit(status.ok?0:1);
  setInterval(()=>{},1<<30);
}
main().catch(e=>{ console.error(e); process.exit(1); });
