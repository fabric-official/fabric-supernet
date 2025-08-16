#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const model_1 = require("./commands/model");
const push_1 = require("./commands/push");
const bake_1 = require("./commands/bake");
const scaffold_1 = require("./commands/scaffold");
const registry_1 = require("./commands/registry");
const monitor_1 = require("./commands/monitor");
const energy_1 = require("./commands/energy");
const rollback_1 = require("./commands/rollback");
const child_process_1 = require("child_process");
const program = new commander_1.Command(); // ✅ Must come before addCommand
// Register commands
program.addCommand(monitor_1.monitorCommand);
program.addCommand(energy_1.energyCommand);
program.addCommand(rollback_1.rollbackCommand);
program
    .name("fab")
    .description("Fabric CLI – model & workflow tooling")
    .version("1.0.0");
// -----------------------------------------------------------------------------
// fab model <action>
// -----------------------------------------------------------------------------
const model = program.command("model").description("Model operations");
model
    .command("validate <patterns...>")
    .description("Validate one or more model.yaml files")
    .action(async (patterns) => {
    try {
        await (0, model_1.validateModels)(patterns);
        console.log("✅ Validation passed");
    }
    catch (err) {
        console.error("❌ Validation failed:", err.message);
        process.exit(1);
    }
});
model
    .command("publish <patterns...>")
    .description("Publish one or more models to the registry")
    .action(async (patterns) => {
    try {
        await (0, model_1.publishModels)(patterns);
        console.log("✅ Publish succeeded");
    }
    catch (err) {
        console.error("❌ Publish failed:", err.message);
        process.exit(1);
    }
});
model
    .command("push <modelName> <version>")
    .description("Push a Fabric model version to the GitHub registry")
    .action(async (modelName, version) => {
    try {
        await (0, push_1.pushModel)(modelName, version);
        console.log(`✅ Model '${modelName}:${version}' pushed to GitHub`);
    }
    catch (err) {
        console.error("❌ Push failed:", err.message);
        process.exit(1);
    }
});
model
    .command("bake <yamlPath>")
    .description("Bake serial_id, sign_date, and manifest_sig into model.yaml")
    .action(async (yamlPath) => {
    try {
        await (0, bake_1.bakeModel)(yamlPath);
    }
    catch (err) {
        console.error("❌ Bake failed:", err.message);
        process.exit(1);
    }
});
// -----------------------------------------------------------------------------
// fab scaffold agent <AgentName> [--policy region:IN vertical:healthcare]
// -----------------------------------------------------------------------------
program
    .command("scaffold agent <name>")
    .description("Scaffold a new .fab agent file with optional policy fields")
    .option("--policy <kv...>", "Dynamic policy key:value pairs")
    .action(async (name, options) => {
    try {
        await (0, scaffold_1.scaffoldAgent)(name, options);
    }
    catch (err) {
        console.error("❌ Scaffold failed:", err.message);
        process.exit(1);
    }
});
// -----------------------------------------------------------------------------
// fab index-tags <modelYamlPath>
// -----------------------------------------------------------------------------
program
    .command("index-tags <modelYamlPath>")
    .description("Extract policy metadata as tags for registry")
    .action(async (modelYamlPath) => {
    try {
        await (0, registry_1.indexRegistryTags)(modelYamlPath);
    }
    catch (err) {
        console.error("❌ Indexing failed:", err.message);
        process.exit(1);
    }
});
// -----------------------------------------------------------------------------
// fab build --atomized | audit --collapse-trace | verify --bit-dag
// -----------------------------------------------------------------------------
program
    .command("build")
    .option("--atomized", "Trigger compiler atomization pass")
    .description("Run compiler atomization pass")
    .action((opts) => {
    if (opts.atomized) {
        const result = (0, child_process_1.spawnSync)("fab", ["atom", "build"], {
            stdio: "inherit",
            shell: true,
        });
        process.exit(result.status ?? 1);
    }
});
program
    .command("audit")
    .option("--collapse-trace", "Audit collapsed bits trace log")
    .description("Audit collapse traces")
    .action((opts) => {
    if (opts["collapse-trace"]) {
        const result = (0, child_process_1.spawnSync)("fab", ["atom", "audit"], {
            stdio: "inherit",
            shell: true,
        });
        process.exit(result.status ?? 1);
    }
});
program
    .command("verify")
    .option("--bit-dag", "Replay and validate DAG")
    .description("Verify DAG links of bit mutation trace")
    .action((opts) => {
    if (opts["bit-dag"]) {
        const result = (0, child_process_1.spawnSync)("fab", ["atom", "verify"], {
            stdio: "inherit",
            shell: true,
        });
        process.exit(result.status ?? 1);
    }
});
program.parse(process.argv);
//# sourceMappingURL=index.js.map