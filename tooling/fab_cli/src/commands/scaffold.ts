// src/commands/scaffold.ts
import fs from "fs";
import path from "path";

interface ScaffoldOptions {
    policy?: string[]; // Example: ['region:IN', 'vertical:agriculture']
}

function parsePolicyFlags(flags: string[] = []): Record<string, string> {
    const entries: Record<string, string> = {};
    for (const pair of flags) {
        const [key, val] = pair.split(":");
        if (!key || !val) continue;
        entries[key.trim()] = val.trim();
    }
    return entries;
}

function renderPolicyBlock(policyMap: Record<string, string>): string {
    const lines = Object.entries(policyMap).map(([key, val]) => {
        const quoted = /^[0-9.]+$/.test(val) ? val : `"${val}"`;
        return `  ${key}: ${quoted};`;
    });
    return `policy {\n${lines.join("\n")}\n}`;
}

export async function scaffoldAgent(agentName: string, opts: ScaffoldOptions) {
    const filename = `${agentName}.fab`;
    const filepath = path.resolve(process.cwd(), filename);

    if (fs.existsSync(filepath)) {
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

    fs.writeFileSync(filepath, content, "utf-8");
    console.log(`✅ Agent scaffolded to ${filename}`);
}
