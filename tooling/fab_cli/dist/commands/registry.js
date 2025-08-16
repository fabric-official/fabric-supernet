"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexRegistryTags = indexRegistryTags;
// src/commands/registry.ts
const registry_1 = require("../registry");
async function indexRegistryTags(modelPath) {
    (0, registry_1.indexModelMetadata)(modelPath);
}
//# sourceMappingURL=registry.js.map