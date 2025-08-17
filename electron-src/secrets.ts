import * as crypto from "crypto"; import * as fs from "fs"; import * as path from "path"; import { spawnSync } from "child_process";
const keyFile = path.join(process.cwd(),"config","secret.key");
function loadKey(): Buffer { if(process.platform==="win32") return Buffer.alloc(0); if(!fs.existsSync(keyFile)) fs.writeFileSync(keyFile, crypto.randomBytes(32)); return fs.readFileSync(keyFile); }
export function encrypt(buf:Buffer):Buffer{
  if(process.platform==="win32"){
    const b64 = buf.toString("base64");
    const ps='[Byte[]]$d=[Convert]::FromBase64String("'+b64+'");$o=[Security.Cryptography.ProtectedData]::Protect($d,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser);[Convert]::ToBase64String($o)';
    const r=spawnSync("powershell.exe",["-NoProfile","-NonInteractive","-Command",ps],{encoding:"utf8"}); if(r.status!==0) throw new Error("DPAPI encrypt failed: "+r.stderr);
    return Buffer.from(r.stdout.trim(),"base64");
  }else{
    const key=loadKey(), iv=crypto.randomBytes(12); const c=crypto.createCipheriv("aes-256-gcm",key,iv);
    const ct=Buffer.concat([c.update(buf),c.final()]); const tag=c.getAuthTag(); return Buffer.concat([Buffer.from([1]),iv,tag,ct]);
  }
}
export function decrypt(buf:Buffer):Buffer{
  if(process.platform==="win32"){
    const b64=buf.toString("base64");
    const ps='[Byte[]]$d=[Convert]::FromBase64String("'+b64+'");$o=[Security.Cryptography.ProtectedData]::Unprotect($d,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser);[Convert]::ToBase64String($o)';
    const r=spawnSync("powershell.exe",["-NoProfile","-NonInteractive","-Command",ps],{encoding:"utf8"}); if(r.status!==0) throw new Error("DPAPI decrypt failed: "+r.stderr);
    return Buffer.from(r.stdout.trim(),"base64");
  }else{
    if(buf[0]!==1) throw new Error("secret version"); const iv=buf.subarray(1,13), tag=buf.subarray(13,29), ct=buf.subarray(29);
    const d=crypto.createDecipheriv("aes-256-gcm",loadKey(),iv); d.setAuthTag(tag); return Buffer.concat([d.update(ct),d.final()]);
  }
}