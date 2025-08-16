"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateModels = validateModels;
exports.publishModels = publishModels;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const ajv_1 = __importDefault(require("ajv"));
const ajv_formats_1 = __importDefault(require("ajv-formats"));
const crypto_1 = require("crypto");
const push_1 = require("./push");
// Root & schema
const root = path_1.default.resolve(__dirname, "../../..");
const schemaPath = path_1.default.resolve(__dirname, "../model.schema.json");
const schema = JSON.parse(fs_1.default.readFileSync(schemaPath, "utf8"));
// AJV validator setup
const ajv = new ajv_1.default({ allErrors: true });
(0, ajv_formats_1.default)(ajv);
const validate = ajv.compile(schema);
// Hash generator (excluding signatures)
function calculateManifestHash(modelPath) {
    const doc = js_yaml_1.default.load(fs_1.default.readFileSync(modelPath, "utf8"));
    const copy = { ...doc };
    delete copy.signatures;
    return (0, crypto_1.createHash)("sha256").update(JSON.stringify(copy, null, 2)).digest("hex");
}
// Artifact file hasher
function calculateArtifactHash(weightsPath) {
    const fileBuffer = fs_1.default.readFileSync(weightsPath);
    return (0, crypto_1.createHash)("sha256").update(fileBuffer).digest("hex");
}
// Search for serial reuse
function findFilesWithSerialId(serialId, dir) {
    const results = [];
    const walk = (d) => {
        for (const entry of fs_1.default.readdirSync(d, { withFileTypes: true })) {
            const entryPath = path_1.default.join(d, entry.name);
            if (entry.isDirectory()) {
                walk(entryPath);
            }
            else if (entry.name === "model.yaml") {
                const content = js_yaml_1.default.load(fs_1.default.readFileSync(entryPath, "utf8"));
                if (content?.serial_id === serialId) {
                    results.push(entryPath);
                }
            }
        }
    };
    walk(dir);
    return results;
}
// Validate one or more models
async function validateModels(patterns) {
    for (const p of patterns) {
        const yamlText = await fs_1.default.promises.readFile(p, "utf8");
        const doc = js_yaml_1.default.load(yamlText);
        const valid = validate(doc);
        if (!valid) {
            const errors = (validate.errors || [])
                .map((err) => ` - ${err.instancePath || err.schemaPath} ${err.message}`)
                .join("\n");
            throw new Error(`❌ Schema validation failed for ${p}:\n${errors}`);
        }
        if (!doc.serial_id.match(/^edge-vision-v2@\d+\.\d+\.\d+#([a-f0-9]{12,64})$/)) {
            throw new Error(`❌ Invalid or missing serial_id in ${p}`);
        }
        const msig = doc.signatures?.manifest_sig;
        if (!msig?.match(/^[0-9a-f]{64}$/)) {
            throw new Error(`❌ Invalid manifest_sig in ${p}`);
        }
        if (!doc.sign_date || isNaN(Date.parse(doc.sign_date))) {
            throw new Error(`❌ Invalid sign_date in ${p}`);
        }
        const actualHash = calculateManifestHash(p);
        if (msig !== actualHash) {
            throw new Error(`❌ Manifest hash mismatch in ${p}. Expected: ${msig}, Actual: ${actualHash}`);
        }
    }
}
// Publish model and enforce serial lock
async function publishModels(patterns) {
    for (const p of patterns) {
        const fullPath = path_1.default.resolve(p);
        const rawYaml = await fs_1.default.promises.readFile(fullPath, "utf8");
        const modelYaml = js_yaml_1.default.load(rawYaml);
        // Core fields validation
        const name = modelYaml.name;
        const version = modelYaml.version;
        const serialId = modelYaml.serial_id;
        if (!name || !version || !serialId) {
            throw new Error(`❌ Missing name/version/serial_id in ${p}`);
        }
        // Ensure signatures object exists
        if (!modelYaml.signatures) {
            modelYaml.signatures = { manifest_sig: "", artifact_sig: "" };
        }
        // Recalculate manifest_sig if invalid
        if (!/^[0-9a-f]{64}$/.test(modelYaml.signatures.manifest_sig)) {
            modelYaml.signatures.manifest_sig = calculateManifestHash(fullPath);
            console.warn(`⚠️  Recalculated manifest_sig: ${modelYaml.signatures.manifest_sig}`);
        }
        // Recalculate artifact_sig if invalid
        const weightsPath = path_1.default.join(path_1.default.dirname(fullPath), "inference", "weights_fp32.onnx");
        if (!/^[0-9a-f]{64}$/.test(modelYaml.signatures.artifact_sig)) {
            if (!fs_1.default.existsSync(weightsPath)) {
                throw new Error(`❌ Missing artifact file: ${weightsPath}`);
            }
            modelYaml.signatures.artifact_sig = calculateArtifactHash(weightsPath);
            console.warn(`⚠️  Recalculated artifact_sig: ${modelYaml.signatures.artifact_sig}`);
        }
        // Write updated manifest
        const serialized = js_yaml_1.default.dump(modelYaml, { noRefs: true, sortKeys: false });
        await fs_1.default.promises.writeFile(fullPath, serialized, "utf8");
        console.log(`📦 Publishing ${name}:${version}...`);
        await validateModels([p]);
        // Check for serial_id collisions
        const registryPath = path_1.default.resolve(root, "tooling/.fabric-models-tmp");
        if (fs_1.default.existsSync(registryPath)) {
            const collisions = findFilesWithSerialId(serialId, registryPath);
            const ownPathFrag = path_1.default.join(name, version);
            const conflict = collisions.find(f => !f.includes(ownPathFrag));
            if (conflict) {
                throw new Error(`❌ serial_id '${serialId}' already used by another model:\n  → ${conflict}`);
            }
        }
        await (0, push_1.pushModel)(name, version);
    }
}
//# sourceMappingURL=model.js.map