// src/commands/registry.ts
import { indexModelMetadata } from "../registry";

export async function indexRegistryTags(modelPath: string) {
    indexModelMetadata(modelPath);
}
