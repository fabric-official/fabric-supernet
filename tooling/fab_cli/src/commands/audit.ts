import { Command } from "commander";
import { loadConfig } from "../utils.js";
import axios from "axios";

export const cmdAudit = new Command("audit")
  .description("Query provenance ledger (append-only DAG)")
  .option("--head <url>", "ledger base URL (override)")
  .action(async (opts) => {
    const cfg = loadConfig();
    const base = opts.head || cfg.provenanceLedger || "http://localhost:8084";
    // simple health check / pseudo head fetch (depends on your ledger API)
    const r = await axios.get(base + "/healthz").catch(()=>({data:{ok:false}}));
    console.log("ledger:", r.data);
  });
