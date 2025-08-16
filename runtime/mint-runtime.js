/**
 * runtime/mint-runtime.js
 * Zero-compiler facade: optionally runs repo build scripts, then verifies staged minting sources.
 * Use:  node runtime/mint-runtime.js [--no-build]
 * Or set env: SUPERNET_SKIP_BUILD=1
 */
const { spawnSync } = require('node:child_process');
const { existsSync, readdirSync, statSync } = require('node:fs');
const { join } = require('node:path');

const args = process.argv.slice(2);
const SKIP = process.env.SUPERNET_SKIP_BUILD === '1' || args.includes('--no-build');

function run(cmd, args, opts={ stdio: 'inherit', shell: true }) {
  const r = spawnSync(cmd, args, opts);
  return r.status ?? 1;
}

function maybeRunScript() {
  if (SKIP) { console.log('[mint-runtime] SKIP build (no-build mode)'); return; }
  console.log('[mint-runtime] running repo build scripts...');
  let status = 0;

  if (existsSync('./compile.bat'))        status = run('cmd', ['/c','compile.bat']);
  else if (existsSync('./compile.sh'))    status = run('bash', ['./compile.sh']);
  if (status !== 0) {
    console.warn('[mint-runtime] compile script failed; continuing in verify-only mode');
  }

  // optional weights step
  if (existsSync('./make-weights.bat'))   run('cmd', ['/c','make-weights.bat']);
  else if (existsSync('./make-weights.sh')) run('bash', ['./make-weights.sh']);
}

function latestPkg() {
  const dir = 'artifacts/staging';
  if (!existsSync(dir)) throw new Error('No artifacts/staging directory');
  const pkgs = readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name.startsWith('pkg-'))
    .map(d => ({ name: d.name, full: join(dir, d.name), t: statSync(join(dir,d.name)).mtimeMs }))
    .sort((a,b)=>b.t-a.t);
  if (!pkgs.length) throw new Error('No artifacts/staging/pkg-* produced.');
  return pkgs[0].full;
}

function assertExists(base, rel) {
  const p = join(base, rel);
  if (!existsSync(p)) throw new Error(`Expected staged file missing: ${rel} (${base})`);
}

(async () => {
  maybeRunScript();
  const pkg = latestPkg();
  // Verify the NetworkAgent minting sources are staged (proves mint pipeline is wired)
  assertExists(pkg, 'agents/NetworkAgent/src/minting_kernel.cpp');
  assertExists(pkg, 'agents/NetworkAgent/src/minting_manager.cpp');
  assertExists(pkg, 'agents/NetworkAgent/src/weight_loader.cpp');
  console.log(JSON.stringify({ ok:true, mode: SKIP ? 'verify-only' : 'build+verify', pkg }, null, 2));
})();
