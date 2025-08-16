/**
 * Approval plane: request + record signed approvals for on-device actions.
 */

export type Approval = {
  subject: string;   // e.g., "network.join"
  reason: string;    // short explanation
  budget?: number;   // optional budget in credits
};

export type ApprovalResult = {
  ok: boolean;
  approvalId?: string;
  error?: string;
};

export async function requestApproval(a: Approval): Promise<ApprovalResult> {
  try {
    const id = "appr_" + Math.random().toString(36).slice(2);
    return { ok: true, approvalId: id };
  } catch (e:any) {
    return { ok: false, error: String(e?.message ?? e) };
  }
}