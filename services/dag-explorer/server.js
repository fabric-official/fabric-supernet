import fs from "fs";
import path from "path";
import express from "express";

const app = express();
const root = path.resolve(process.cwd(), "services/dag-explorer/public");
const ledger = path.resolve(process.cwd(), "services/provenance-client/data/ledger.ndjson");

app.use("/", express.static(root));
app.get("/ledger", (_req,res)=>{
  if(!fs.existsSync(ledger)) return res.status(404).send("ledger missing");
  res.setHeader("content-type","text/plain; charset=utf-8");
  fs.createReadStream(ledger).pipe(res);
});
app.listen(8084, "127.0.0.1", ()=>console.log("[dag-explorer] http://127.0.0.1:8084"));