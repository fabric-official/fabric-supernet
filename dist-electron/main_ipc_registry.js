"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_INVOKE = void 0;
exports.requireCapability = requireCapability;
exports.ALLOWED_INVOKE = new Set([
    "plugin:list",
    "plugin:get",
    "env:version"
]);
const REQUIRES = {
    "plugin:list": [],
    "plugin:get": ["plugins:read"],
    "env:version": []
};
function requireCapability(channel, supplied) {
    const needed = REQUIRES[channel] || [];
    const missing = needed.filter(c => !supplied.includes(c));
    if (missing.length)
        throw new Error(`Missing capability for "${channel}": ${missing.join(", ")}`);
}
