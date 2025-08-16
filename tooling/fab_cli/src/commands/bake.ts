import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import crypto from "crypto";
import chalk from "chalk";

/**
 * Compute a deterministic SHA256 hash from an object (canonical JSON).
 */
function computeHash(obj: any): string {
    const json = JSON.stringify(obj, Object.keys(obj).sort());
    return crypto.createHash("sha256").update(json).digest("hex");
}

/**
 * Bake immutable fields into model.yaml (serial_id, sign_date, manifest_sig).
 */
export async function bakeModel(yamlPath: string): Promise<void> {
    const fullPath = path.resolve(yamlPath);
    const yamlText = await fs.promises.readFile(fullPath, "utf8");
    const doc = yaml.load(yamlText) as any;

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
    const manifestSig = crypto.createHash("sha256")
        .update(JSON.stringify(doc, Object.keys(doc).sort()))
        .digest("hex");

    doc.signatures = {
        ...(doc.signatures || {}),
        manifest_sig: manifestSig,
        artifact_sig: doc.signatures?.artifact_sig || "<TO_BE_FILLED>"
    };

    // Write back to disk
    const updatedYaml = yaml.dump(doc, { noRefs: true, sortKeys: true });
    await fs.promises.writeFile(fullPath, updatedYaml, "utf8");

    console.log(chalk.green(`✅ Baked model manifest at ${yamlPath}`));
    console.log(chalk.gray(` - serial_id: ${serial_id}`));
    console.log(chalk.gray(` - manifest_sig: ${manifestSig}`));
}
