import * as fs from "fs"; import * as path from "path"; import * as crypto from "crypto";
const DEV=path.join(process.cwd(),"devices.json"); const NON=path.join(process.cwd(),"nonces.json"); const SITE=path.join(process.cwd(),"config","site.secret");
function siteKey(){ if(!fs.existsSync(SITE)) fs.writeFileSync(SITE, crypto.randomBytes(32)); return fs.readFileSync(SITE) }
function loadJson(p:string,d:any){ try{ return JSON.parse(fs.readFileSync(p,"utf8")) }catch{ return d } }
export function challenge(){ const n=crypto.randomBytes(16).toString("hex"); const non=loadJson(NON,{}) as Record<string,number>; non[n]=Date.now(); fs.writeFileSync(NON,JSON.stringify(non,null,2)); return { nonce:n } }
export function prove(deviceId:string, nonce:string, proof:string){
  const non=loadJson(NON,{}) as Record<string,number>; if(!non[nonce]) throw new Error("nonce replay/unknown"); delete non[nonce]; fs.writeFileSync(NON,JSON.stringify(non,null,2));
  const mac=crypto.createHmac("sha256",siteKey()).update(deviceId+":"+nonce).digest("hex"); if(mac!==proof) throw new Error("bad hmac");
  const dev=loadJson(DEV,[]) as any[]; dev.push({ id:deviceId, ts:Date.now() }); fs.writeFileSync(DEV,JSON.stringify(dev,null,2)); return { ok:true };
}
export function register(deviceId:string){ const dev=loadJson(DEV,[]) as any[]; if(!dev.find(d=>d.id===deviceId)){ dev.push({id:deviceId,ts:Date.now()}); fs.writeFileSync(DEV,JSON.stringify(dev,null,2)); } return { ok:true } }