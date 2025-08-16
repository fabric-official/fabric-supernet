import fs from "fs";
import path from "path";
import yaml from "js-yaml";

interface AgentIR {
    name: string;
    model_id: string;
    inputs: string[];
    outputs: string[];
    policy?: Record<string, any>;
    auditTrail?: boolean;
}

interface ModelYAML {
    name: string;
    version: string;
    agents: AgentIR[];
    tags?: Record<string, string>[];
}

/**
 * Extracts tag metadata from AgentIR.policy fields
 * @param agent AgentIR object
 */
function extractTagsFromPolicy(agent: AgentIR): Record<string, string>[] {
    const tags: Record<string, string>[] = [];

    if (!agent.policy) return tags;

    for (const [key, value] of Object.entries(agent.policy)) {
        if (
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
        ) {
            tags.push({ [key]: String(value) });
        }
    }

    return tags;
}

/**
 * Deduplicates tags array based on key+value
 */
function deduplicateTags(tags: Record<string, string>[]): Record<string, string>[] {
    const seen = new Set<string>();
    const unique: Record<string, string>[] = [];

    for (const tag of tags) {
        const [key, value] = Object.entries(tag)[0];
        const signature = `${key}:${value}`;
        if (!seen.has(signature)) {
            seen.add(signature);
            unique.push({ [key]: value });
        }
    }

    return unique;
}

/**
 * Augments model.yaml with `tags:` based on agent policy metadata
 * @param modelPath Path to model.yaml file
 */
export function indexModelMetadata(modelPath: string): void {
    const fullPath = path.resolve(modelPath);
    if (!fs.existsSync(fullPath)) {
        throw new Error(`File not found: ${fullPath}`);
    }

    const raw = fs.readFileSync(fullPath, "utf-8");
    const parsed = yaml.load(raw) as ModelYAML;

    if (!parsed.agents || parsed.agents.length === 0) {
        throw new Error(`No agents defined in model.yaml at ${fullPath}`);
    }

    const allTags: Record<string, string>[] = [];
    for (const agent of parsed.agents) {
        allTags.push(...extractTagsFromPolicy(agent));
    }

    parsed.tags = deduplicateTags(allTags);

    const updatedYAML = yaml.dump(parsed, {
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
    });

    fs.writeFileSync(fullPath, updatedYAML, "utf-8");
    console.log(`✅ Indexed policy tags written to ${modelPath}`);
}
