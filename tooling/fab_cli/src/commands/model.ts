import { Command } from "commander";
import { loadConfig, makeHttp } from "../utils.js";
import fs from "fs-extra";
import path from "node:path";

export const cmdModel = new Command("model").description("Model registry utilities");

cmdModel
  .command("push")
  .requiredOption("--name <id>")
  .requiredOption("--version <semver>")
  .requiredOption("--weights <file>")
  .action(async (opts) => {
    const cfg = loadConfig(); const http = makeHttp(cfg);
    const weights = await fs.readFile(path.resolve(opts.weights));
    const weightsSha = (await import("node:crypto")).then(c=>c.createHash("sha256").update(weights).digest("hex"));
    const manifest = {
      model_id: opts.name, version: opts.version, created_utc: new Date().toISOString(),
      policy: { privacy: "anonymized" }, weights_sha256: await weightsSha,
      provenance: { training_data_hash: "deadbeef", training_code_hash: "deadbeef", policy_hash: "deadbeef" },
      metadata: {}
    };
    const initBody = { manifest };
    const initBytes = Buffer.from(JSON.stringify(initBody));
    const sig = (await import("node:crypto")).createHmac("sha256", cfg.hmacKey || "devkey").update(initBytes).digest("hex");
    await http.post(`/v1/models/${opts.name}/${opts.version}/init`, initBody, { headers: { "x-fabric-signature": sig } });
    const sig2 = (await import("node:crypto")).createHmac("sha256", cfg.hmacKey || "devkey").update(weights).digest("hex");
    await http.put(`/v1/models/${opts.name}/${opts.version}/weights`, weights, { headers: { "x-fabric-signature": sig2, "Content-Type": "application/octet-stream" } });
    console.log("PUSH OK");
  });

cmdModel
  .command("pull")
  .requiredOption("--name <id>").requiredOption("--version <semver>").requiredOption("--out <dir>")
  .action(async (opts) => {
    const cfg = loadConfig(); const http = makeHttp(cfg);
    await fs.ensureDir(opts.out);
    const man = await http.get(`/v1/models/${opts.name}/${opts.version}/manifest`);
    await fs.writeJson(path.join(opts.out, "model.json"), man.data, { spaces: 2 });
    const w = await http.get(`/v1/models/${opts.name}/${opts.version}/weights`, { responseType: "arraybuffer" });
    await fs.writeFile(path.join(opts.out, "weights.bin"), Buffer.from(w.data));
    console.log("PULL OK");
  });

cmdModel
  .command("list")
  .option("--name <id>")
  .action(async (opts) => {
    const cfg = loadConfig(); const http = makeHttp(cfg);
    if (opts.name) {
      const v = await http.get(`/v1/models/${opts.name}/versions`);
      console.log(JSON.stringify(v.data, null, 2));
    } else {
      const m = await http.get(`/v1/models`);
      console.log(JSON.stringify(m.data, null, 2));
    }
  });
