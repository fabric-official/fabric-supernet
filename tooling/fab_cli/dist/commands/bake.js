"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bakeModel = bakeModel;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const crypto_1 = __importDefault(require("crypto"));
const chalk_1 = __importDefault(require("chalk"));
/**
 * Compute a deterministic SHA256 hash from an object (canonical JSON).
 */
function computeHash(obj) {
    const json = JSON.stringify(obj, Object.keys(obj).sort());
    return crypto_1.default.createHash("sha256").update(json).digest("hex");
}
/**
 * Bake immutable fields into model.yaml (serial_id, sign_date, manifest_sig).
 */
async function bakeModel(yamlPath) {
    const fullPath = path_1.default.resolve(yamlPath);
    const yamlText = await fs_1.default.promises.readFile(fullPath, "utf8");
    const doc = js_yaml_1.default.load(yamlText);
    if (!doc.name || !doc.version) {
        throw new Error("❌ model.yaml is missing name or version");
    }
    // Clone base for hash (exclude existing signatures if present)
    const docForHash = { ...doc };
    delete docForHash.signatures;
    const baseHash = computeHash(docForHash).slice(0, 32); // Shorten hash if desired
    const serial_id = `${doc.name}@${doc.version}#${baseHash}`;
    const sign_date = new Date().toISOString();
    // Add baked-in fields
    doc.serial_id = serial_id;
    doc.sign_date = sign_date;
    // Create manifest signature (simple SHA256 hash here)
    const manifestSig = crypto_1.default.createHash("sha256")
        .update(JSON.stringify(doc, Object.keys(doc).sort()))
        .digest("hex");
    doc.signatures = {
        ...(doc.signatures || {}),
        manifest_sig: manifestSig,
        artifact_sig: doc.signatures?.artifact_sig || "<TO_BE_FILLED>"
    };
    // Write back to disk
    const updatedYaml = js_yaml_1.default.dump(doc, { noRefs: true, sortKeys: true });
    await fs_1.default.promises.writeFile(fullPath, updatedYaml, "utf8");
    console.log(chalk_1.default.green(`✅ Baked model manifest at ${yamlPath}`));
    console.log(chalk_1.default.gray(` - serial_id: ${serial_id}`));
    console.log(chalk_1.default.gray(` - manifest_sig: ${manifestSig}`));
}
//# sourceMappingURL=bake.js.map