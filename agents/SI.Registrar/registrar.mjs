import { now, readJSON, writeJSON } from "./lib/helpers.mjs"; import { readdirSync, existsSync } from "node:fs";
async function safeRead(path){ try { return await readJSON(path); } catch { return null; } }
async function main(){ const out = { ts: now(), build: await safeRead("../SI.Builder/out/build.json") || await safeRead("./in/build.json"), test: await safeRead("../SI.Tester/out/test.json") || await safeRead("./in/test.json"), deploy: await safeRead("../SI.Deployer/out/deploy.json") || await safeRead("./in/deploy.json"), health: await safeRead("../SI.Watcher/out/health.json") || await safeRead("./in/health.json"), policy: await safeRead("../SI.Sentry.Policy/out/policy.json") || await safeRead("./in/policy.json"), provenance: { digest: null, artifacts: [] } };
  const artDir = "../SI.Builder/out/artifacts"; if(existsSync(artDir)){ try { out.provenance.artifacts = readdirSync(artDir); } catch {} } out.provenance.digest = out.deploy?.digest || null;
  await writeJSON("./out/register.json", out); await writeJSON("./artifacts/status.json", { ok:true, registered:true, ts: now() }); console.log("[registrar] recorded");
}
main().catch(e=>{ console.error(e); process.exit(1); });
