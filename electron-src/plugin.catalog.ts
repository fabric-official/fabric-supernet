import * as fs from "fs"; import * as path from "path"; import { spawnSync } from "child_process";
const DB=path.join(process.cwd(),"data","plugins.json"); const DIR=path.join(process.cwd(),"data","plugins");
function load(){ try{ return JSON.parse(fs.readFileSync(DB,"utf8")) }catch{ return [] } }
function save(x:any){ fs.mkdirSync(path.dirname(DB),{recursive:true}); fs.writeFileSync(DB,JSON.stringify(x,null,2)) }
export function list(){ return load() }
export function install(id:string, opts:{repo?:string;path?:string}){ fs.mkdirSync(DIR,{recursive:true}); const dest=path.join(DIR,id);
  if(opts.repo){ const r=spawnSync("git",["clone","--depth","1",opts.repo,dest],{encoding:"utf8"}); if(r.status!==0) throw new Error("git clone failed: "+(r.stderr||r.stdout)); }
  else if(opts.path){ fs.cpSync(opts.path,dest,{recursive:true}) } else { fs.mkdirSync(dest,{recursive:true}) }
  const items=load().filter((p:any)=>p.id!==id); items.push({id, path:dest}); save(items); return { ok:true }
}
export function remove(id:string){ const items=load(); const it=items.find((p:any)=>p.id===id); if(it && fs.existsSync(it.path)) fs.rmSync(it.path,{recursive:true,force:true}); save(items.filter((p:any)=>p.id!==id)); return { ok:true } }