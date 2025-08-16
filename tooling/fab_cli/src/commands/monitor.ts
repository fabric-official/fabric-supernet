import { Command } from "commander";
import axios from "axios";

export const cmdMonitor = new Command("monitor")
  .description("Tail telemetry from SuperNet agents")
  .option("--discovery <url>", "discovery agent base", "http://localhost:8085")
  .option("--bidding <url>", "bidding agent base", "http://localhost:8086")
  .option("--routing <url>", "routing agent base", "http://localhost:8087")
  .action(async (opts) => {
    async function tick() {
      const d = await axios.get(opts.discovery + "/healthz").catch(()=>({data:{status:"down"}}));
      const b = await axios.get(opts.bidding + "/healthz").catch(()=>({data:{status:"down"}}));
      const r = await axios.get(opts.routing + "/healthz").catch(()=>({data:{status:"down"}}));
      process.stdout.write(`\rdiscovery:${d.data.status} bidding:${b.data.status} routing:${r.data.status}        `);
    }
    setInterval(tick, 1000);
    await new Promise(()=>{});
  });
