import { Command } from "commander";
import fs from "fs-extra";
import path from "node:path";
import { spawn } from "node:child_process";

export const cmdBuild = new Command("build")
  .description("Build Fab DSL modules and lower to IR")
  .option("--src <file>", "Fab file", "examples/assistive_vision.fab")
  .option("--out <dir>", "Output directory", "out")
  .action(async (opts) => {
    const root = process.cwd();
    const outDir = path.resolve(opts.out);
    await fs.ensureDir(outDir);
    // call fabric_Lang installed binary (assumes `npm run build` done there)
    const fabc = path.resolve("fabric_Lang/dist/bin/fabc.js");
    await exec("node", [fabc, "lower", opts.src, "-o", path.join(outDir, "module.ir.json")]);
    console.log("IR written to", path.join(outDir, "module.ir.json"));
  });

function exec(cmd: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit" });
    p.on("exit", (code) => code === 0 ? resolve() : reject(new Error(cmd + " exit " + code)));
  });
}
