import * as fs from "fs"; import * as path from "path"; import * as crypto from "crypto";
type Policy = { capabilities: Record<string, boolean>; roots?: string[]; toolchain?: { git?: { path?: string; sha256?: string } } };
const policyPath = path.join(process.cwd(),"config","fabricsec.policy.json");
let policy: Policy = { capabilities: {} }; try{ policy = JSON.parse(fs.readFileSync(policyPath,"utf8")) }catch{}
export function requireCapability(cap: string){ if(!cap) throw new Error("cap required"); if(!policy.capabilities?.[cap]) throw new Error(`capability denied: ${cap}`) }
export function scopeFile(p: string){
  if(!p) throw new Error("path required"); const abs = path.resolve(p);
  const roots = (policy.roots?.length? policy.roots: ["out","data"]).map(r=>path.resolve(r));
  if(roots.some(r => abs===r || abs.startsWith(r+path.sep))) return abs;
  throw new Error(`path not in allowed scope: ${abs}`);
}
export function toolchainPinnedOk(toolPath?: string){
  const pin = policy.toolchain?.git; if(!pin) return true;
  if(pin.path && toolPath && path.resolve(toolPath)!==path.resolve(pin.path)) return false;
  if(pin.sha256){ const p = toolPath ?? pin.path; if(!p || !fs.existsSync(p)) return false; const h = crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex"); return h.toLowerCase()===pin.sha256.toLowerCase(); }
  return true;
}