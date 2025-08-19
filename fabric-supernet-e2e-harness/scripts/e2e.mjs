import 'dotenv/config';
import pc from 'picocolors';
import { execa } from 'execa';
import fs from 'fs';
import path from 'path';
import enquirer from 'enquirer';
const { prompt } = enquirer;

const PROFILE = process.env.PROFILE || 'real';
const COMPOSE_FILE = process.env.COMPOSE_FILE || 'docker-compose.yml';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const API_BASE = process.env.API_BASE || 'http://localhost:8080';
const READINESS_TIMEOUT_MS = Number(process.env.READINESS_TIMEOUT_MS || 120000);
const HEALTH_RETRY_MS = Number(process.env.HEALTH_RETRY_MS || 1500);

async function sh(cmd, args, opts={}){
  const p = execa(cmd, args, { stdio: 'inherit', ...opts });
  try { await p } catch (e) { throw e }
}

async function waitHttp(url, timeoutMs, intervalMs){
  const start = Date.now();
  while (Date.now() - start < timeoutMs){
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {}
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return false;
}

async function bringUp(){
  console.log(pc.cyan(pc.bold(`
â–¶ docker compose up -d (profile=${PROFILE})`)));
  await sh('docker', ['compose','-f',COMPOSE_FILE,'--profile',PROFILE,'up','-d']);
  const dashHealth = (BASE_URL + (process.env.DASHBOARD_HEALTH || '/'));
  const apiHealth = (API_BASE + (process.env.API_HEALTH || '/api/health'));

  console.log(pc.cyan(`
â–¶ waiting for dashboard: ${dashHealth}`));
  const dashOk = await waitHttp(dashHealth, READINESS_TIMEOUT_MS, HEALTH_RETRY_MS);
  if (!dashOk) throw new Error(`Dashboard not healthy: ${dashHealth}`);

  if (PROFILE === 'real'){
    console.log(pc.cyan(`
â–¶ waiting for api: ${apiHealth}`));
    const apiOk = await waitHttp(apiHealth, READINESS_TIMEOUT_MS, HEALTH_RETRY_MS);
    if (!apiOk) throw new Error(`API not healthy: ${apiHealth}`);
  }
}

const specs = [
  'tests/e2e/01_device_enroll.spec.ts',
  'tests/e2e/02_policy_manager.spec.ts',
  'tests/e2e/03_registry_publish.spec.ts',
  'tests/e2e/04_treasury_and_dao.spec.ts',
  'tests/e2e/05_telemetry.spec.ts',
  'tests/e2e/06_app_store.spec.ts',
  'tests/e2e/99_dead_clicks.spec.ts'
];

async function runSpec(spec){
  console.log(pc.bold(pc.cyan(`
â–¶ Running ${spec}`)));
  try {
    const p = execa('npx', ['playwright','test',spec,'--project=chromium','--reporter=list'], { stdio: 'inherit', env: { ...process.env } });
    const { exitCode } = await p;
    return exitCode === 0;
  } catch (e) {
    return false;
  }
}

async function main(){
  try {
    if (!process.env.SKIP_DOCKER) { await bringUp(); }
  } catch (e) {
    console.error(pc.red(pc.bold('Compose bring-up failed: ' + e.message)));
    process.exit(1);
  }

  for (let i=0;i<specs.length;i++){
    const ok = await runSpec(specs[i]);
    if (!ok){
      console.log(pc.red(pc.bold(`âœ– Failure in ${specs[i]}`)));
      const ans = await prompt({
        type: 'select',
        name: 'action',
        message: 'Fix the issue, then choose:',
        choices: [
          { name: 'retry', message: 'Retry this test' },
          { name: 'skip', message: 'Skip and continue' },
          { name: 'stop', message: 'Stop run' },
          { name: 'logs', message: 'Show docker logs (api & dashboard)' }
        ]
      });
      if (ans.action === 'retry'){ i--; continue; }
      if (ans.action === 'skip'){ continue; }
      if (ans.action === 'logs'){
        await sh('docker',['compose','-f',COMPOSE_FILE,'logs','--tail','200','api','dashboard']);
        i--; continue;
      }
      if (ans.action === 'stop'){ process.exit(1); }
    }
  }
  console.log(pc.green(pc.bold('\nâœ” E2E suite finished')));
  process.exit(0);
}

main().catch(e=>{ console.error(e); process.exit(1); });


