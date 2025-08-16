"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
/* device.enroll.proof - acceptance/smoke path */
async function handle({ fp, pub, proof }) {
    const fs = require('fs');
    const path = require('path');
    const nacl = require('tweetnacl');
    const ROOT = path.resolve(process.cwd(), 'repo');
    const SITE = path.join(ROOT, 'site');
    const chalDir = path.join(SITE, 'enroll_challenges');
    const pendDir = path.join(ROOT, 'devices', 'pending');
    fs.mkdirSync(pendDir, { recursive: true });
    const id = String(fp || '').trim();
    const phex = String(pub || '').trim();
    const shex = String(proof || '').trim();
    if (!id || !phex || !shex)
        throw new Error('VALIDATION');
    const chalPath = path.join(chalDir, id + '.json');
    if (!fs.existsSync(chalPath))
        throw new Error('NO_CHALLENGE');
    const chal = JSON.parse(fs.readFileSync(chalPath, 'utf8'));
    const msg = Buffer.from(`${chal.fp}|${chal.nonce}|${chal.ts}`, 'utf8');
    const ok = nacl.sign.detached.verify(new Uint8Array(msg), new Uint8Array(Buffer.from(shex, 'hex')), new Uint8Array(Buffer.from(phex, 'hex')));
    if (!ok)
        throw new Error('BAD_SIGNATURE');
    const rec = { fp: id, pub: phex, requested_at: new Date().toISOString() };
    fs.writeFileSync(path.join(pendDir, id + '.json'), JSON.stringify(rec, null, 2), 'utf8');
    try {
        fs.unlinkSync(chalPath);
    }
    catch { }
    return { ok: true, queued: true };
}
