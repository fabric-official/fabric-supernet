import fs from "fs";
import path from "path";
import express from "express";
import bodyParser from "body-parser";
import Ajv from "ajv";

const cfg = JSON.parse(fs.readFileSync(new URL("../config/config.json", import.meta.url)));
const schema = JSON.parse(fs.readFileSync(new URL("../config/event.schema.json", import.meta.url)));
const ajv = new Ajv({allErrors:true, removeAdditional:false, strict:false});
const validate = ajv.compile(schema);

const app = express();
app.use(bodyParser.json({ limit: cfg.maxBodyKB + "kb" }));

const ledgerAbs = path.resolve(process.cwd(), cfg.ledgerPath);
fs.mkdirSync(path.dirname(ledgerAbs), { recursive: true });
if (!fs.existsSync(ledgerAbs)) fs.writeFileSync(ledgerAbs, "");

app.get("/health", (_req,res)=>res.json({ok:true, service:"provenance-client"}));

app.post("/write", (req,res)=>{
  const ev = req.body;
  if(!validate(ev)){
    return res.status(400).json({ok:false, error:"schema", details:validate.errors});
  }
  const line = JSON.stringify(ev) + "\n";
  fs.appendFileSync(ledgerAbs, line, { encoding:"utf8" });
  return res.json({ok:true});
});

app.listen(cfg.listen.port, cfg.listen.host, ()=>{
  console.log(`[provenance-client] listening on ${cfg.listen.host}:${cfg.listen.port}`);
});