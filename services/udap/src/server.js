import crypto from "crypto";
import fs from "fs";
import express from "express";
import bodyParser from "body-parser";

const cfg = JSON.parse(fs.readFileSync(new URL("../config/config.json", import.meta.url)));

const app = express();
app.use(bodyParser.json({ limit: "128kb" }));

app.get("/health", (_req,res)=>res.json({ok:true, service:"udap"}));

app.post("/attest", (req,res)=>{
  const { deviceId, nonce, claims, sig } = req.body || {};
  if(!deviceId || !nonce || !claims || !sig) return res.status(400).json({ok:false, error:"missing_fields"});
  const msg = JSON.stringify({deviceId, nonce, claims});
  const mac = crypto.createHmac("sha256", cfg.hmacSecret).update(msg).digest("hex");
  if(mac !== sig) return res.status(401).json({ok:false, error:"bad_signature"});
  return res.json({ok:true, attested:true});
});

app.listen(cfg.listen.port, cfg.listen.host, ()=>{
  console.log(`[udap] listening on ${cfg.listen.host}:${cfg.listen.port}`);
});