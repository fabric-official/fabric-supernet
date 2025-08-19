import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const PLUGINS_DIR = path.join(ROOT, "plugins");
const REG_PATH = path.join(ROOT, "registry/index.json");
const REG_SIG = path.join(ROOT, "registry/index.json.sig");
const WRITE = process.argv.includes("--write");
const CHECK = process.argv.includes("--check") || !WRITE;
const DEMO_IDS = new Set(["fabric.hello-world"]); // never publish demos

const die = (m) => { console.error("❌", m); process.exit(1); };
const warn = (m) => console.error("⚠️ ", m);
const ok = (m) => console.log("✅", m);

if (!fs.existsSync(PLUGINS_DIR)) die("plugins/ directory missing");

const dirs = fs.readdirSync(PLUGINS_DIR, { withFileTypes:true })
  .filter(d => d.isDirectory()).map(d => d.name);

const computed = [];
let errors = 0;

for (const dir of dirs) {
  const pdir = path.join(PLUGINS_DIR, dir);
  const manifestPath = path.join(pdir, "fabric-plugin.json");
  if (!fs.existsSync(manifestPath)) { warn(`${dir}: missing fabric-plugin.json`); errors++; continue; }

  let manifest;
  try { manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")); }
  catch { warn(`${dir}: invalid json in fabric-plugin.json`); errors++; continue; }

  const id = manifest.id;
  if (!id) { warn(`${dir}: manifest.id missing`); errors++; continue; }
  if (DEMO_IDS.has(id)) { ok(`${id}: demo detected — skipped for publish`); continue; }

  const entry = manifest.entry || "bundle/index.esm.js";
  const bundle = path.join(pdir, entry);
  const sig = bundle + ".sig";
  const sbom = path.join(path.dirname(bundle), "sbom.json");

  if (!fs.existsSync(bundle)) { warn(`${id}: missing bundle (${path.relative(ROOT,bundle)})`); errors++; continue; }
  if (!fs.existsSync(sig) || fs.statSync(sig).size < 64) { warn(`${id}: missing/placeholder signature (${path.relative(ROOT,sig)})`); errors++; continue; }
  if (!fs.existsSync(sbom) || fs.statSync(sbom).size < 16) { warn(`${id}: missing/empty SBOM (${path.relative(ROOT,sbom)})`); errors++; continue; }

  const badPlaceholders = ["TBD","TODO","example.com","<replace>","<pubkey>","BASE64_PUBKEY","YOUR_KEY_HERE"];
  const txt = fs.readFileSync(bundle, "utf8");
  if (badPlaceholders.some(p => txt.includes(p))) { warn(`${id}: bundle contains placeholders`); errors++; continue; }

  const sha256 = crypto.createHash("sha256").update(fs.readFileSync(bundle)).digest("hex");
  computed.push({
    id,
    name: manifest.name || id,
    publisher: manifest.publisher || "fabric",
    description: manifest.description || "",
    categories: manifest.categories || [],
    latest: manifest.version || "1.0.0",
    permissions: manifest.permissions || [],
    versions: [{
      v: manifest.version || "1.0.0",
      sha256,
      url: path.posix.join("plugins", dir, entry.replaceAll("\\","/")),
      sig: path.posix.join("plugins", dir, (entry + ".sig").replaceAll("\\","/")),
      sbom: path.posix.join("plugins", dir, "bundle/sbom.json"),
      minShell: manifest.minShell || "1.0.0"
    }]
  });
}

const newRegistry = { version: 1, plugins: computed };

if (CHECK) {
  if (!fs.existsSync(REG_PATH)) die("registry/index.json missing");
  const current = JSON.parse(fs.readFileSync(REG_PATH,"utf8"));
  const same = JSON.stringify(current) === JSON.stringify(newRegistry);
  if (!same) { warn("registry/index.json is out of sync with disk (run --write)"); errors++; }
  if (!fs.existsSync(REG_SIG) || fs.statSync(REG_SIG).size < 64) { warn("registry signature missing/placeholder"); errors++; }
  if (errors) process.exit(1);
  ok("registry in sync and signed; all plugins fully wired");
} else {
  fs.mkdirSync(path.dirname(REG_PATH), { recursive: true });
  fs.writeFileSync(REG_PATH, JSON.stringify(newRegistry, null, 2));
  ok("registry/index.json updated from disk truth");
  const sig = spawnSync(process.execPath, ["./scripts/sign.mjs", "registry/index.json"], { stdio: "inherit" });
  if (sig.status !== 0) die("failed to sign registry/index.json");
  ok("registry/index.json signed");
}
