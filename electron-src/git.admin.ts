import { spawnSync } from "child_process"; import * as fs from "fs"; import * as path from "path";
import { encrypt, decrypt } from "./secrets"; import { toolchainPinnedOk } from "./fabricsec";
function runGit(args:string[], cwd:string){ const gitCmd="git"; if(!toolchainPinnedOk(undefined)) throw new Error("git toolchain not pinned"); const r=spawnSync(gitCmd,args,{cwd,encoding:"utf8"}); if(r.status!==0) throw new Error(`git ${args.join(" ")} failed: ${r.stderr||r.stdout}`); return r.stdout }
export function statusClean(cwd:string){ return runGit(["status","--porcelain"],cwd).trim().length===0 }
export function pull(cwd:string){ if(!statusClean(cwd)) throw new Error("pre-pull: dirty tree"); return runGit(["pull","--no-rebase","-X","theirs"],cwd) }
export function push(cwd:string){ return runGit(["push"],cwd) }
const CREDS=path.join(process.cwd(),"config","git.creds.enc");
export function saveCreds(obj:{username:string;password:string}){ fs.writeFileSync(CREDS, encrypt(Buffer.from(JSON.stringify(obj),"utf8"))); return { ok:true } }
export function loadCreds(){ if(!fs.existsSync(CREDS)) return null; return JSON.parse(decrypt(fs.readFileSync(CREDS)).toString("utf8")) }