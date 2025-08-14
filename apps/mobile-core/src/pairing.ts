/**
 * QR + passkey binding entry points.
 * These functions expose a stable API for Android/iOS wrappers.
 */

export type PairingRequest = {
  deviceId: string;
  userHandle: string;
  publicKeyPem?: string;
};

export type PairingResult = {
  ok: boolean;
  sessionId?: string;
  error?: string;
};

export async function startPairing(req: PairingRequest): Promise<PairingResult> {
  try {
    // deterministic session id for demo wiring; replace with live service call when enabled
    const sid = `sess_${req.deviceId}_${Date.now()}`;
    return { ok: true, sessionId: sid };
  } catch (e:any) {
    return { ok: false, error: String(e?.message ?? e) };
  }
}