
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import minimatch from 'minimatch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const ajv = new Ajv({ allErrors: true, strict: process.env.SCHEMA_STRICT === '1' });
addFormats(ajv);

const pluginSchema = JSON.parse(fs.readFileSync(path.join(root, 'schemas/fabric-plugin.schema.json'), 'utf8'));

function fail(msg) { console.error(msg); process.exit(1); }
function ok(msg) { console.log('✔', msg); }

function listTargets() {
  try {
    const { execSync } = await import('node:child_process');
    const out = execSync('git diff --name-only --diff-filter=AMR HEAD~1', { cwd: root }).toString();
    const files = out.split('\n').filter(Boolean);
    const folders = new Set();
    files.forEach(f => { if (minimatch(f, 'plugins/**')) folders.add(f.split('/').slice(0,2).join('/')); });
    return Array.from(folders).length ? Array.from(folders) : fs.readdirSync(path.join(root, 'plugins')).map(p => `plugins/${p}`);
  } catch {
    const base = path.join(root, 'plugins');
    return fs.existsSync(base) ? fs.readdirSync(base).map(p => `plugins/${p}`) : [];
  }
}

const REQUIRE_SBOM = process.env.REQUIRE_SBOM === '1';
const SECRET_SCAN = process.env.SECRET_SCAN === '1';

const validator = ajv.compile(pluginSchema);
const targets = listTargets();
if (!targets.length) { console.log('No plugin changes detected'); process.exit(0); }

for (const dir of targets) {
  const abs = path.join(root, dir);
  const manifestPath = path.join(abs, 'fabric-plugin.json');
  if (!fs.existsSync(manifestPath)) fail(`Missing manifest: ${manifestPath}`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const valid = validator(manifest);
  if (!valid) fail(`Manifest invalid for ${dir}: ${ajv.errorsText(validator.errors)}`);
  ok(`Manifest valid: ${dir}`);

  const bundle = path.join(abs, 'bundle/index.esm.js');
  const sbom = path.join(abs, 'bundle/sbom.json');
  if (!fs.existsSync(bundle)) fail(`Missing bundle: ${bundle}`);
  if (REQUIRE_SBOM && !fs.existsSync(sbom)) fail(`Missing SBOM: ${sbom}`);
  ok(`Bundle present${REQUIRE_SBOM ? ' + SBOM' : ''}: ${dir}`);

  if (SECRET_SCAN) {
    const txt = fs.readFileSync(bundle, 'utf8');
    const patterns = [/AWS_SECRET/i, /PRIVATE_KEY/i, /BEGIN\s+PRIVATE\s+KEY/i, /api[_-]?key\s*=\s*['"][A-Za-z0-9_\-]{16,}/i];
    if (patterns.some(rx => rx.test(txt))) fail(`Possible secret found in ${bundle}`);
    ok(`No obvious secrets: ${dir}`);
  }
}
