import { writeFileSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const now = () => new Date().toISOString();
const here = dirname(fileURLToPath(import.meta.url));
const root = process.env.SI_PROJECT_ROOT || resolve(here, "..", "..");
const eco  = process.env.SI_ECOSYSTEM || resolve(root, "agents", "ecosystem.config.js");

// PowerShell-friendly pm2 reload -> start fallback
const psCmd = `pm2 reload "${eco}" --update-env; if ($LASTEXITCODE -ne 0) { pm2 start "${eco}" --update-env }`;

function shPS(cwd, cmd) {
  return new Promise((res, rej) => {
    const child = spawn("powershell.exe", ["-NoProfile","-ExecutionPolicy","Bypass","-Command", cmd], { cwd, env: process.env });
    let out = "", err = "";
    child.stdout.on("data", d => out += d.toString());
    child.stderr.on("data", d => err += d.toString());
    child.on("close", code => code === 0 ? res({ out }) : rej({ out, err, code }));
  });
}

async function main(){
  const result = {
    started_at: now(),
    ok: null,
    endpoint: process.env.SI_DEPLOY_ENDPOINT || "http://127.0.0.1:8080",
    cwd: root,
    ecosystem: eco,
    cmd: `pm2 reload "${eco}" --update-env`
  };
  try {
    const r = await shPS(root, psCmd);
    result.ok = true; result.out = r.out;
  } catch(e) {
    result.ok = false; result.err = e.err || e.out || String(e);
  }
  result.finished_at = now();
  mkdirSync(resolve(here, "out"), { recursive: true });
  writeFileSync(resolve(here, "out", "deploy.json"), JSON.stringify(result, null, 2));
  console.log("[deployer]", result.ok ? "ok" : "fail", `cwd=${root}`, eco);
  if (!result.ok) process.exit(4);
}
main().catch(e => { console.error(e); process.exit(1); });
