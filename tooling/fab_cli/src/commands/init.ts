import { Command } from "commander";
import fs from "fs-extra";
import path from "node:path";

export const cmdInit = new Command("init")
  .description("Scaffold a Fabric project")
  .option("--dir <path>", "directory", ".")
  .action(async (opts) => {
    const root = path.resolve(opts.dir);
    await fs.ensureDir(root);
    await fs.writeFile(path.join(root, "fabric.config.yaml"), `registryBase: http://localhost:8090
economyBase: http://localhost:8095
provenanceLedger: http://localhost:8084
`);
    console.log("Initialized Fabric project at", root);
  });
