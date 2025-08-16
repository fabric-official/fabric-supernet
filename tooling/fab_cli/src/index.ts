import { Command } from "commander";
import chalk from "chalk";
import { cmdInit } from "./commands/init.js";
import { cmdBuild } from "./commands/build.js";
import { cmdDeploy } from "./commands/deploy.js";
import { cmdModel } from "./commands/model.js";
import { cmdAudit } from "./commands/audit.js";
import { cmdCompliance } from "./commands/compliance.js";
import { cmdMonitor } from "./commands/monitor.js";
import fs from "fs-extra";

const program = new Command();
program
  .name("fab")
  .description("Fabric CLI")
  .version("1.0.0");

program.addCommand(cmdInit);
program.addCommand(cmdBuild);
program.addCommand(cmdDeploy);
program.addCommand(cmdModel);
program.addCommand(cmdAudit);
program.addCommand(cmdCompliance);
program.addCommand(cmdMonitor);

(async () => {
  try {
    await program.parseAsync(process.argv);
  } catch (e: any) {
    console.error(chalk.red(e?.message || e));
    process.exit(1);
  }
})();
