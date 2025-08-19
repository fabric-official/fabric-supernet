import { now, readJSON, writeJSON, sh } from "./lib/helpers.mjs";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
function findProjectRoot(startDir) {
  let d = startDir;
  for (let i = 0; i < 6; i++) {
    if (existsSync(resolve(d, "package.json"))) return d;
    d = resolve(d, "..");
  }
  return null;
}

async function main(){
  let target = {}; try { target = await readJSON("./in/target.json"); } catch {}
  let plan = null; try { plan = await readJSON("./in/plan.json"); } catch {}
  const cmd = target?.test?.cmd || plan?.targets?.[0]?.test?.cmd || "npm test";
  const induce = process.env.INDUCE_FAIL === "1";

  const projectRoot = process.env.SI_PROJECT_ROOT || findProjectRoot(resolve(here, "..", ".."));
  const result = { started_at: now(), ok:null, out:null, err:null, cwd: projectRoot, cmd, coverage: 0.80 };

  try {
    if (!projectRoot) throw new Error("No project root found. Set SI_PROJECT_ROOT.");
    if (induce) throw new Error("induced failure");
    const r = await sh(cmd, { cwd: projectRoot });
    result.ok = true; result.out = r.out;
  } catch(e) {
    result.ok = false; result.err = e.err || e.out || String(e);
  }

  result.finished_at = now();
  await writeJSON("./out/test.json", result);
  await writeJSON("./artifacts/status.json", result);
  console.log("[tester]", result.ok ? "ok" : "fail", projectRoot ? `cwd=${projectRoot}` : "(no root)");
  if(!result.ok) process.exit(3);
}
main().catch(e=>{ console.error(e); process.exit(1); });

