import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'node:child_process';
import { minimatch } from 'minimatch';

// Ajv 2020 (ESM): import from explicit file path
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import meta2020 from 'ajv/dist/refs/json-schema-2020-12/schema.json' with { type: 'json' };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function fail(msg) { console.error(msg); process.exit(1); }
function ok(msg) { console.log('', msg); }

// Ajv setup (draft 2020-12)
const ajv = new Ajv2020({ allErrors: true, strict: process.env.SCHEMA_STRICT === '1' });
// Only add draft 2020-12 metaschema if not present
if (!ajv.getSchema('https://json-schema.org/draft/2020-12/schema')) { ajv.addMetaSchema(meta2020); }
addFormats(ajv);

// Load plugin schema
const pluginSchemaPath = path.join(root, 'schemas/fabric-plugin.schema.json');
if (!fs.existsSync(pluginSchemaPath)) fail(`Schema missing: ${pluginSchemaPath}`);
const pluginSchema = JSON.parse(fs.readFileSync(pluginSchemaPath, 'utf8'));

function listTargets() {
  try {
    const out = execSync('git diff --name-only --diff-filter=AMR HEAD~1', { cwd: root }).toString();
    const files = out.split('\n').filter(Boolean);
    const folders = new Set();
    files.forEach(f => { if (minimatch(f, 'plugins/**')) folders.add(f.split('/').slice(0,2).join('/')); });
    return folders.size ? Array.from(folders) :
      (fs.existsSync(path.join(root,'plugins')) ? fs.readdirSync(path.join(root, 'plugins')).map(p => `plugins/${p}`) : []);
  } catch {
    const base = path.join(root, 'plugins');
    return fs.existsSync(base) ? fs.readdirSync(base).map(p => `plugins/${p}`) : [];
  }
}

const REQUIRE_SBOM = process.env.REQUIRE_SBOM === '1';
const SECRET_SCAN  = process.env.SECRET_SCAN === '1';

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
  const sbom   = path.join(abs, 'bundle/sbom.json');
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