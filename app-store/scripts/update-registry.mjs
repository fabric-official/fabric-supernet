import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import semver from 'semver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const REGISTRY_PATH = path.join(root, process.env.REGISTRY_FILE || 'registry/index.json');
const RAW_BASE = process.env.APPSTORE_RAW_BASE || 'https://raw.githubusercontent.com/fabric-official/app-store/main';

function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) return { version: 1, plugins: [] };
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
}

function saveRegistry(reg) {
  reg.plugins.sort((a, b) => a.id.localeCompare(b.id));
  reg.plugins.forEach(p => p.versions.sort((a, b) => semver.rcompare(a.v, b.v)));
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(reg, null, 2) + '\n', 'utf8');
  console.log(' updated registry:', REGISTRY_PATH);
}

const reg = loadRegistry();
const base = path.join(root, process.env.PLUGINS_DIR || 'plugins');
if (!fs.existsSync(base)) { saveRegistry(reg); process.exit(0); }

for (const name of fs.readdirSync(base)) {
  const dir = path.join(base, name);
  if (!fs.statSync(dir).isDirectory()) continue;
  const manifestPath = path.join(dir, 'fabric-plugin.json');
  if (!fs.existsSync(manifestPath)) continue;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  const id = manifest.id;
  const publisher = manifest.publisher || id.split('.')[0];
  const pname = manifest.name || id;
  const version = manifest.version;

  const rel = path.relative(root, dir).replace(/\\/g, '/'); // plugins/<publisher>.<name>
  const urlBase = `${RAW_BASE}/${rel}`;

  const entry = {
    v: version,
    url: `${urlBase}/bundle/index.esm.js`,
    sig: `${urlBase}/bundle/index.esm.js.sig`,
    sigstore: `${urlBase}/bundle/index.esm.js.sigstore`,
    sbom: `${urlBase}/bundle/sbom.json`
  };

  let p = reg.plugins.find(x => x.id === id);
  if (!p) {
    p = { id, name: pname, publisher, latest: version, versions: [entry], manifest: `${urlBase}/fabric-plugin.json` };
    reg.plugins.push(p);
  } else {
    const existing = p.versions.find(v => v.v === version);
    if (!existing) p.versions.push(entry);
    if (!p.latest || semver.gt(version, p.latest)) p.latest = version;
    p.name = pname;
    p.publisher = publisher;
    p.manifest = `${urlBase}/fabric-plugin.json`;
  }
}

saveRegistry(reg);