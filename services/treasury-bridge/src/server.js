import fs from "fs";
import path from "path";
import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const cfg = JSON.parse(fs.readFileSync(new URL("../config/config.json", import.meta.url)));
const queueAbs = path.resolve(process.cwd(), cfg.queuePath);
fs.mkdirSync(path.dirname(queueAbs), { recursive: true });
if (!fs.existsSync(queueAbs)) fs.writeFileSync(queueAbs, "");

const app = express();
app.use(bodyParser.json({ limit: "128kb" }));

app.get("/health", (_req,res)=>res.json({ok:true, service:"treasury-bridge"}));

app.post("/pay", async (req,res)=>{
  const { payer, amount, ref } = req.body || {};
  if(!payer || !amount || !ref) return res.status(400).json({ok:false, error:"missing_fields"});
  const evt = { ts:new Date().toISOString(), payer, amount, ref };
  fs.appendFileSync(queueAbs, JSON.stringify(evt)+"\n");

  try{
    await fetch(cfg.provenanceWrite, {
      method:"POST",
      headers:{ "content-type":"application/json" },
      body: JSON.stringify({ ts: evt.ts, agent:"treasury-bridge", action:"payment", payload:evt, sig:"local" })
    });
  }catch(_e){ /* soft-fail provenance notify; queue retains record */ }

  return res.json({ok:true, queued:true});
});

app.listen(cfg.listen.port, cfg.listen.host, ()=>{
  console.log(`[treasury-bridge] listening on ${cfg.listen.host}:${cfg.listen.port}`);
});