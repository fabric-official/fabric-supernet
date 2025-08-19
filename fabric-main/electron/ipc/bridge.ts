type AnyFn = (...args: any[]) => any;

function req(p: string): any { try { return require(p); } catch { return null; } }
function modDefault(m: any): AnyFn { return (m && (m.default ?? m)) as AnyFn; }

const srcChallenge = modDefault(req('./device.enroll.challenge'));
const srcProof     = modDefault(req('./device.enroll.proof'));
const distChallenge = modDefault(req('../../dist-electron/ipc/device.enroll.challenge.js'));
const distProof     = modDefault(req('../../dist-electron/ipc/device.enroll.proof.js'));

const challengeImpl = srcChallenge ?? distChallenge;
const proofImpl     = srcProof     ?? distProof;

if (!challengeImpl || !proofImpl) {
  throw new Error('Enroll IPC handlers not found. Expected electron/ipc/device.enroll.(challenge|proof)[.ts] or dist-electron/ipc/*.js');
}

export async function enrollChallenge(): Promise<any> {
  return await challengeImpl();
}
export async function enrollProof(payload: { nonce: string; proof: string; device?: any }): Promise<any> {
  return await proofImpl(payload);
}
