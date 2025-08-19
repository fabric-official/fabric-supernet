import { now, readJSON, writeJSON } from "./lib/helpers.mjs";
async function main(){ let req = {}; try { req = await readJSON("./in/rollback_request.json"); } catch {} let prov= {}; try { prov = await readJSON("./in/provenance.json"); } catch {}
  const from = req?.from || prov?.current || "unknown"; const to = req?.to || prov?.previous || "unknown"; const ok = Boolean(to && to !== "unknown"); const result = { ok, from, to, reason: req?.reason || "policy/health rollback", ts: now() };
  await writeJSON("./out/rollback.json", result); await writeJSON("./artifacts/status.json", result); console.log("[rollbacker]", ok ? `revert to ${to}` : "no target"); process.exit(ok?0:6);
}
main().catch(e=>{ console.error(e); process.exit(1); });
