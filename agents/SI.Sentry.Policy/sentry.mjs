import { now, readJSON, writeJSON } from "./lib/helpers.mjs";
const RULES = { maxTargets: 12 };
function validate(plan){ const issues = []; if(plan.targets && plan.targets.length > RULES.maxTargets) issues.push(`too many targets: ${plan.targets.length} > ${RULES.maxTargets}`); return issues; }
async function main(){ let plan = null; try { plan = await readJSON("./in/plan.json"); } catch {}
  if(!plan){ const res = { ok:false, ts: now(), reason: "missing plan" }; await writeJSON("./out/policy.json", res); await writeJSON("./artifacts/status.json", res); console.log("[sentry] missing plan"); process.exit(7); }
  const issues = validate(plan); const res = { ok: issues.length===0, issues, ts: now() }; await writeJSON("./out/policy.json", res); await writeJSON("./artifacts/status.json", res); console.log("[sentry]", res.ok ? "allow" : "deny", issues); process.exit(res.ok?0:7);
}
main().catch(e=>{ console.error(e); process.exit(1); });
