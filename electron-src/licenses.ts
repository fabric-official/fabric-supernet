import * as fs from "fs"; import * as path from "path"; import * as crypto from "crypto";
const PUB=path.join(process.cwd(),"registry.pub");
function pubKey(){
  const t=fs.readFileSync(PUB,"utf8").trim();
  if(t.includes("BEGIN PUBLIC KEY")) return crypto.createPublicKey(t);
  return crypto.createPublicKey({ key: Buffer.from(t,"base64"), format:"der", type:"spki" });
}
export function summary(payloadB64:string, sigB64:string, seats:{total:number,used:number}, revoked:number){
  const ok = crypto.verify(null, Buffer.from(payloadB64,"base64"), pubKey(), Buffer.from(sigB64,"base64"));
  return { verified: ok, seats, revoked };
}