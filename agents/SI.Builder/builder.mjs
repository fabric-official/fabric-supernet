import { now, readJSON, writeJSON, sh } from "./lib/helpers.mjs";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
function findProjectRoot(startDir) {
  // Walk up until we find a package.json
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
  const cmd = target?.build?.cmd || plan?.targets?.[0]?.build?.cmd || "npm run build";

  const projectRoot = process.env.SI_PROJECT_ROOT || findProjectRoot(resolve(here, "..", ".."));
  const result = { started_at: now(), ok:null, out:null, err:null, cwd: projectRoot, cmd };

  if (!projectRoot) {
    result.ok = false;
    result.err = "Could not locate project root (no package.json found up the tree). Set SI_PROJECT_ROOT.";
  } else {
    try {
      const r = await sh(cmd, { cwd: projectRoot });
      result.ok = true; result.out = r.out;
    } catch(e) {
      result.ok = false; result.err = e.err || e.out || String(e);
    }
  }

  result.finished_at = now();
  await writeJSON("./out/build.json", result);
  await writeJSON("./artifacts/status.json", result);
  console.log("[builder]", result.ok ? "ok" : "fail", projectRoot ? `cwd=${projectRoot}` : "(no root)");
  if(!result.ok) process.exit(2);
}
main().catch(e=>{ console.error(e); process.exit(1); });

