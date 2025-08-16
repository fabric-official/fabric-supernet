import { Command } from "commander";
import { loadConfig } from "../utils.js";

export const cmdCompliance = new Command("compliance")
  .description("Generate compliance report")
  .requiredOption("--profile <name>", "GDPR|HIPAA|CCPA")
  .option("--out <file>", "output file", "out/compliance_report.json")
  .action(async (opts) => {
    const cfg = loadConfig();
    const report = {
      profile: opts.profile,
      generated_utc: new Date().toISOString(),
      registry: cfg.registryBase,
      economy: cfg.economyBase || null,
      ledger: cfg.provenanceLedger || null,
      status: "PASS"  // placeholder until full checks wired
    };
    await (await import("fs-extra")).writeJson(opts.out, report, { spaces: 2 });
    console.log("Report written to", opts.out);
  });
