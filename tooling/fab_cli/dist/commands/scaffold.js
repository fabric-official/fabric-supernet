"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scaffoldAgent = scaffoldAgent;
// src/commands/scaffold.ts
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function parsePolicyFlags(flags = []) {
    const entries = {};
    for (const pair of flags) {
        const [key, val] = pair.split(":");
        if (!key || !val)
            continue;
        entries[key.trim()] = val.trim();
    }
    return entries;
}
function renderPolicyBlock(policyMap) {
    const lines = Object.entries(policyMap).map(([key, val]) => {
        const quoted = /^[0-9.]+$/.test(val) ? val : `"${val}"`;
        return `  ${key}: ${quoted};`;
    });
    return `policy {\n${lines.join("\n")}\n}`;
}
async function scaffoldAgent(agentName, opts) {
    const filename = `${agentName}.fab`;
    const filepath = path_1.default.resolve(process.cwd(), filename);
    if (fs_1.default.existsSync(filepath)) {
        console.error(`❌ File already exists: ${filename}`);
        process.exit(1);
    }
    const policyMap = parsePolicyFlags(opts.policy);
    const policyBlock = Object.keys(policyMap).length > 0
        ? renderPolicyBlock(policyMap)
        : `policy {\n  // Add custom policy fields here\n}`;
    const content = `agent ${agentName} {
  id: "${agentName.toLowerCase()}-001";
  model_id: "${agentName}:1.0.0";

  inputs {
    input: string;
  }

  outputs {
    result: string;
  }

  ${policyBlock}
}
`;
    fs_1.default.writeFileSync(filepath, content, "utf-8");
    console.log(`✅ Agent scaffolded to ${filename}`);
}
//# sourceMappingURL=scaffold.js.map