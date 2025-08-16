import { Command } from "commander";
import { loadConfig, makeHttp, hmacHex } from "../utils.js";
import fs from "fs-extra";
import path from "node:path";

export const cmdDeploy = new Command("deploy")
  .description("Deploy compiled models to the registry and notify runtime")
  .requiredOption("--name <id>", "model id")
  .requiredOption("--version <semver>", "semantic version")
  .requiredOption("--weights <file>", "weights file")
  .option("--manifest <file>", "manifest JSON", "out/model.json")
  .action(async (opts) => {
    const cfg = loadConfig();
    const http = makeHttp(cfg);
    const weights = await fs.readFile(path.resolve(opts.weights));
    const weightsSha = await (await import("node:crypto")).createHash("sha256").update(weights).digest("hex");

    const manifest = {
      model_id: opts.name,
      version: opts.version,
      created_utc: new Date().toISOString(),
      policy: { privacy: "anonymized", energy_budget: "10J per_event" },
      weights_sha256: weightsSha,
      provenance: { training_data_hash: "deadbeef", training_code_hash: "deadbeef", policy_hash: "deadbeef" },
      metadata: { framework: "onnx" }
    };
    await fs.writeJson(path.resolve(opts.manifest), manifest, { spaces: 2 });

    const initBody = { manifest };
    const initBytes = Buffer.from(JSON.stringify(initBody));
    const sig = (await import("node:crypto")).createHmac("sha256", cfg.hmacKey || "devkey").update(initBytes).digest("hex");
    await http.post(`/v1/models/${opts.name}/${opts.version}/init`, initBody, { headers: { "x-fabric-signature": sig } });

    const sig2 = (await import("node:crypto")).createHmac("sha256", cfg.hmacKey || "devkey").update(weights).digest("hex");
    await http.put(`/v1/models/${opts.name}/${opts.version}/weights`, weights, { headers: { "x-fabric-signature": sig2, "Content-Type": "application/octet-stream" } });

    console.log("Deployed", opts.name, opts.version);
  });
