"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ipcHandlers = void 0;
/// <reference types="node" />
exports.ipcHandlers = {
    "device.enroll.challenge": async (_e, { fp }) => {
        const fs = require("fs");
        const path = require("path");
        const crypto = require("crypto");
        const ROOT = path.resolve(process.cwd(), "repo");
        const SITE = path.join(ROOT, "site");
        const chalDir = path.join(SITE, "enroll_challenges");
        fs.mkdirSync(chalDir, { recursive: true });
        const id = String(fp || "").trim();
        if (!id)
            throw new Error("VALIDATION");
        const nonce = crypto.randomBytes(32).toString("hex");
        const ts = new Date().toISOString();
        const body = { fp: id, nonce, ts };
        fs.writeFileSync(path.join(chalDir, id + ".json"), JSON.stringify(body, null, 2), "utf8");
        return { ok: true, ...body };
    },
    "device.enroll.proof": async (_e, { fp, pub, proof }) => {
        const fs = require("fs");
        const path = require("path");
        const nacl = require("tweetnacl");
        const ROOT = path.resolve(process.cwd(), "repo");
        const SITE = path.join(ROOT, "site");
        const chalDir = path.join(SITE, "enroll_challenges");
        const pendDir = path.join(ROOT, "devices", "pending");
        fs.mkdirSync(pendDir, { recursive: true });
        const id = String(fp || "").trim();
        const phex = String(pub || "").trim();
        const shex = String(proof || "").trim();
        if (!id || !phex || !shex)
            throw new Error("VALIDATION");
        const chalPath = path.join(chalDir, id + ".json");
        if (!fs.existsSync(chalPath))
            throw new Error("NO_CHALLENGE");
        const chal = JSON.parse(fs.readFileSync(chalPath, "utf8"));
        const msg = Buffer.from(`${chal.fp}|${chal.nonce}|${chal.ts}`, "utf8");
        const ok = nacl.sign.detached.verify(new Uint8Array(msg), new Uint8Array(Buffer.from(shex, "hex")), new Uint8Array(Buffer.from(phex, "hex")));
        if (!ok)
            throw new Error("BAD_SIGNATURE");
        const rec = { fp: id, pub: phex, requested_at: new Date().toISOString() };
        fs.writeFileSync(path.join(pendDir, id + ".json"), JSON.stringify(rec, null, 2), "utf8");
        try {
            fs.unlinkSync(chalPath);
        }
        catch { }
        return { ok: true, queued: true };
    },
};
(() => {
    try {
        const reg = exports.ipcHandlers;
        if (typeof reg["enroll.challenge"] === "function")
            reg["device.enroll.challenge"] = reg["enroll.challenge"];
        if (typeof reg["enroll.request"] === "function")
            reg["device.enroll.proof"] = reg["enroll.request"];
        try {
            globalThis.ipcHandlers = reg;
        }
        catch { }
        try {
            if (typeof module !== "undefined" && module.exports) {
                module.exports.ipcHandlers = reg;
                module.exports.default = reg;
            }
        }
        catch { }
    }
    catch { }
})();
exports.default = exports.ipcHandlers;
