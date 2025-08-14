import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { requireAuth, sha256 } from "./auth.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");
const CFG  = JSON.parse(fs.readFileSync(path.join(ROOT,"config","config.json"),"utf8"));
const PORT = Number(CFG.port||8088);
const DATA_DIR = path.join(ROOT,"data");
const CHK_DIR  = path.join(ROOT,"checkpoints");
const LEDGER   = path.join(DATA_DIR,"ledger.ndjson");
const MAX_BYTES= Number(CFG.maxLedgerBytes||52428800);
const MAX_SEGS = Number(CFG.maxSegments||30);
fs.mkdirSync(DATA_DIR,{recursive:true}); fs.mkdirSync(CHK_DIR,{recursive:true}); if(!fs.existsSync(LEDGER)) fs.writeFileSync(LEDGER,"","utf8");
const index=[];
function loadIndexFrom(file){ const d=fs.readFileSync(file,"utf8"); if(!d) return []; return d.split(/\r?\n/).filter(Boolean).map(l=>JSON.parse(l)).map(o=>({id:o.id,ts:o.ts,agent:o.agent,action:o.action,sha:o.sha,parentId:o.parentId})); }
function loadAll(){ index.length=0; const segs=fs.readdirSync(DATA_DIR).filter(f=>/^ledger-\d{8}-\d{6}\.ndjson$/.test(f)).sort(); for(const s of segs){ for(const x of loadIndexFrom(path.join(DATA_DIR,s))) index.push(x);} for(const x of loadIndexFrom(LEDGER)) index.push(x);} loadAll();
function merkleRoot(){ if(index.length===0) return ""; let level=index.map(e=>Buffer.from(e.sha,"hex")); while(level.length>1){ const next=[]; for(let i=0;i<level.length;i+=2){ const L=level[i],R=(i+1<level.length)?level[i+1]:L; next.push(crypto.createHash("sha256").update(Buffer.concat([L,R])).digest()); } level=next; } return level[0].toString("hex").toUpperCase(); }
let appending=Promise.resolve();
async function appendRecord(record,payload){ const line=JSON.stringify({...record,payload_b64:payload.toString("base64")})+"\n"; await (appending=appending.then(()=>fs.promises.appendFile(LEDGER,line,"utf8"))); index.push({id:record.id,ts:record.ts,agent:record.agent,action:record.action,sha:record.sha,parentId:record.parentId}); await maybeRotate(); }
async function maybeRotate(){ const st=fs.statSync(LEDGER); if(st.size<MAX_BYTES) return; const stamp=new Date().toISOString().replace(/[-:T]/g,"").slice(0,15); const seg=path.join(DATA_DIR,`ledger-${stamp}.ndjson`); fs.copyFileSync(LEDGER,seg); fs.writeFileSync(LEDGER,"","utf8"); const root=merkleRoot(); const chk={ts:new Date().toISOString(),merkleRoot:root,segment:path.basename(seg)}; fs.writeFileSync(path.join(CHK_DIR,`checkpoint-${stamp}.json`),JSON.stringify(chk,null,2),"utf8"); const segs=fs.readdirSync(DATA_DIR).filter(f=>/^ledger-\d{8}-\d{6}\.ndjson$/.test(f)).sort(); while(segs.length>MAX_SEGS){ const del=segs.shift(); fs.unlinkSync(path.join(DATA_DIR,del)); } }
const app = express();
app.disable("x-powered-by");
app.use(helmet({contentSecurityPolicy:false}));
app.use(morgan(process.env.NODE_ENV==="production"?"combined":"dev"));
// raw body capture for HMAC
app.use((req,res,next)=>{ const chunks=[]; req.on("data",c=>chunks.push(c)); req.on("end",()=>{ req.rawBody=Buffer.concat(chunks); next();}); });
// Health is open
app.get("/healthz",(_req,res)=>res.json({ok:true}));
// Auth required below this line
app.use(requireAuth);
app.post("/append", async (req,res)=>{ try{ const payload=req.rawBody??Buffer.alloc(0); const sha=sha256(payload); const parentId=index.length?index[index.length-1].id:null; const id=index.length?index[index.length-1].id+1:1; const ts=new Date().toISOString(); const agent=req.header("x-agent")||"unknown"; const action=req.header("x-action")||"exec"; await appendRecord({id,ts,agent,action,sha,parentId},payload); return res.json({id,ts,sha,parentId}); }catch(e){ return res.status(500).json({error:"append_failed"});} });
app.get("/entry/:id(\\d+)",(req,res)=>{ const id=Number(req.params.id); const row=index.find(e=>e.id===id); if(!row) return res.status(404).json({error:"not_found"}); return res.json(row); });
app.get("/merkle/root",(_req,res)=>res.json({root:merkleRoot()}));
app.get("/proof/:id(\\d+)",(req,res)=>{ const id=Number(req.params.id); const row=index.find(e=>e.id===id); if(!row) return res.status(404).json({error:"not_found"}); const chain=[]; let cur=row; while(cur){ chain.push({id:cur.id,sha:cur.sha,parent:cur.parentId}); cur=cur.parentId?index.find(e=>e.id===cur.parentId):null; } return res.json({proof:chain}); });
app.get("/checkpoint/latest",(_req,res)=>{ const list=fs.readdirSync(CHK_DIR).filter(f=>/^checkpoint-\d{8}-\d{6}\.json$/.test(f)).sort(); if(!list.length) return res.json({latest:null}); const p=path.join(CHK_DIR,list[list.length-1]); return res.json(JSON.parse(fs.readFileSync(p,"utf8"))); });
app.listen(PORT,()=>console.log(`[provenance-client] hardened on :${PORT}`));
