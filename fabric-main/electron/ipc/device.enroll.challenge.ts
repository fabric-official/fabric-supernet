/* device.enroll.challenge - acceptance/smoke path */
export async function handle({ fp }: any) {
  const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
  const ROOT = path.resolve(process.cwd(), 'repo'); const SITE = path.join(ROOT, 'site');
  const dir = path.join(SITE, 'enroll_challenges'); fs.mkdirSync(dir, { recursive:true });
  const id = String(fp || '').trim(); if (!id) throw new Error('VALIDATION');
  const body = { fp: id, nonce: crypto.randomBytes(32).toString('hex'), ts: new Date().toISOString() };
  fs.writeFileSync(path.join(dir, id + '.json'), JSON.stringify(body, null, 2), 'utf8');
  return { ok:true, ...body };
}