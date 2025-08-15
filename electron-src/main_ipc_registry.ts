export const ALLOWED_INVOKE = new Set<string>([
  "plugin:list",
  "plugin:get",
  "env:version"
]);

// Per-channel capability requirements
const REQUIRES: Record<string, string[]> = {
  "plugin:list": [],
  "plugin:get":  ["plugins:read"],
  "env:version": []
};

export function requireCapability(channel: string, supplied: string[]) {
  const need = REQUIRES[channel] || [];
  const missing = need.filter(c => !supplied.includes(c));
  if (missing.length) {
    throw new Error(`Missing capability for "${channel}": ${missing.join(", ")}`);
  }
}
