"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexModelMetadata = indexModelMetadata;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const js_yaml_1 = __importDefault(require("js-yaml"));
/**
 * Extracts tag metadata from AgentIR.policy fields
 * @param agent AgentIR object
 */
function extractTagsFromPolicy(agent) {
    const tags = [];
    if (!agent.policy)
        return tags;
    for (const [key, value] of Object.entries(agent.policy)) {
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
            tags.push({ [key]: String(value) });
        }
    }
    return tags;
}
/**
 * Augments model.yaml with `tags:` based on agent policy metadata
 * @param modelPath Path to model.yaml file
 */
function indexModelMetadata(modelPath) {
    const fullPath = path_1.default.resolve(modelPath);
    const raw = fs_1.default.readFileSync(fullPath, "utf-8");
    const parsed = js_yaml_1.default.load(raw);
    if (!parsed.agents || parsed.agents.length === 0) {
        throw new Error("No agents defined in model.yaml");
    }
    const allTags = [];
    for (const agent of parsed.agents) {
        const tags = extractTagsFromPolicy(agent);
        allTags.push(...tags);
    }
    parsed.tags = deduplicateTags(allTags);
    const updatedYAML = js_yaml_1.default.dump(parsed, { lineWidth: -1 });
    fs_1.default.writeFileSync(fullPath, updatedYAML, "utf-8");
    console.log(`✅ Indexed policy tags written to ${modelPath}`);
}
/**
 * Deduplicates tags array based on key+value
 */
function deduplicateTags(tags) {
    const seen = new Set();
    const unique = [];
    for (const tag of tags) {
        const [key, value] = Object.entries(tag)[0];
        const sig = `${key}:${value}`;
        if (!seen.has(sig)) {
            seen.add(sig);
            unique.push({ [key]: value });
        }
    }
    return unique;
}
//# sourceMappingURL=index.js.map