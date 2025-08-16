"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("Auth", {
    setPasscode: (code) => electron_1.ipcRenderer.invoke("auth.setPasscode", { code }),
    login: (code) => electron_1.ipcRenderer.invoke("auth.login", { code }),
    status: () => electron_1.ipcRenderer.invoke("auth.status")
});
electron_1.contextBridge.exposeInMainWorld("LBrain", {
    status: () => electron_1.ipcRenderer.invoke("lbrain.status"),
    setUrl: (url) => electron_1.ipcRenderer.invoke("lbrain.setUrl", { url })
});
electron_1.contextBridge.exposeInMainWorld("PluginRegistry", {
    list: () => electron_1.ipcRenderer.invoke("fabric.plugins.list"),
    installLocal: (folder) => electron_1.ipcRenderer.invoke("fabric.plugins.installLocal", { folder }),
    installFromUrl: (info) => electron_1.ipcRenderer.invoke("fabric.plugins.installFromUrl", info),
    onChanged: (fn) => { electron_1.ipcRenderer.on("fabric.plugins.changed", (_e, data) => fn(data)); return () => electron_1.ipcRenderer.removeAllListeners("fabric.plugins.changed"); }
});
electron_1.contextBridge.exposeInMainWorld("PluginsAdmin", {
    enable: (id, enabled) => electron_1.ipcRenderer.invoke("fabric.plugins.enable", { id, enabled }),
    remove: (id) => electron_1.ipcRenderer.invoke("fabric.plugins.remove", { id }),
    cleanup: () => electron_1.ipcRenderer.invoke("fabric.plugins.cleanup")
});
electron_1.contextBridge.exposeInMainWorld("GitAdmin", {
    setConfig: (url, branch, username, password) => electron_1.ipcRenderer.invoke("git.config.set", { url, branch, username, password }),
    pull: () => electron_1.ipcRenderer.invoke("git.pull"),
    push: () => electron_1.ipcRenderer.invoke("git.push")
});
electron_1.contextBridge.exposeInMainWorld("Compliance", {
    verify: (files, expectedDigest, toolchainId) => electron_1.ipcRenderer.invoke("attest.verify", { files, expectedDigest, toolchainId })
});
electron_1.contextBridge.exposeInMainWorld("Runtime", {
    call: (cmd, args) => electron_1.ipcRenderer.invoke("fabric.runtime.invoke", { cmd, args })
});
electron_1.contextBridge.exposeInMainWorld("Logs", {
    tail: (count) => electron_1.ipcRenderer.invoke("logs.tail", { count }),
    verifyFile: (file) => electron_1.ipcRenderer.invoke("logs.verify.file", { file })
});
electron_1.contextBridge.exposeInMainWorld("Audit", {
    exportToday: () => electron_1.ipcRenderer.invoke("audit.export.today")
});
electron_1.contextBridge.exposeInMainWorld("Devices", {
    list: () => electron_1.ipcRenderer.invoke("device.list"),
    detail: (id) => electron_1.ipcRenderer.invoke("device.detail", { id }),
    rename: (id, name) => electron_1.ipcRenderer.invoke("device.rename", { id, name }),
    remove: (id) => electron_1.ipcRenderer.invoke("device.remove", { id }),
    onUpdate: (fn) => { electron_1.ipcRenderer.on("devices.update", (_e, data) => fn(data)); return () => electron_1.ipcRenderer.removeAllListeners("devices.update"); }
});
electron_1.contextBridge.exposeInMainWorld("Enroll", {
    challenge: (fp) => electron_1.ipcRenderer.invoke("enroll.challenge", { fp }),
    request: (fp, pub, proof) => electron_1.ipcRenderer.invoke("enroll.request", { fp, pub, proof }),
    list: () => electron_1.ipcRenderer.invoke("enroll.list"),
    approve: (fp, name) => electron_1.ipcRenderer.invoke("enroll.approve", { fp, name }),
    deny: (fp) => electron_1.ipcRenderer.invoke("enroll.deny", { fp })
});
electron_1.contextBridge.exposeInMainWorld("Licenses", {
    activate: (licenseId, deviceFp) => electron_1.ipcRenderer.invoke("license.activate", { licenseId, deviceFp }),
    deactivate: (licenseId, deviceFp) => electron_1.ipcRenderer.invoke("license.deactivate", { licenseId, deviceFp }),
    summary: () => electron_1.ipcRenderer.invoke("license.summary")
});
electron_1.contextBridge.exposeInMainWorld("Telemetry", {
    set: (enabled) => electron_1.ipcRenderer.invoke("telemetry.set", { enabled })
});
electron_1.contextBridge.exposeInMainWorld("LogCtrl", {
    setLevel: (level) => electron_1.ipcRenderer.invoke("log.level.set", { level })
});
electron_1.contextBridge.exposeInMainWorld("Updates", {
    check: () => electron_1.ipcRenderer.invoke("updates.check"),
    quitAndInstall: () => electron_1.ipcRenderer.invoke("updates.quitInstall")
});
electron_1.contextBridge.exposeInMainWorld("SiteSetup", {
    run: (wallet) => electron_1.ipcRenderer.invoke("site.setup", { wallet })
});
try {
    // TrustedTypes default policy (no-op passthrough; rely on Sanitize.html for HTML sinks)
    window.trustedTypes?.createPolicy?.("default", {
        createHTML: (s) => s
    });
}
catch { }
function simpleSanitizeHTML(input) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(String(input || ""), "text/html");
        // remove scripts and styles
        doc.querySelectorAll("script,style").forEach(n => n.remove());
        // strip on* attributes and dangerous hrefs/src
        const walk = (el) => {
            [...el.attributes].forEach(a => {
                const n = a.name.toLowerCase();
                const v = (a.value || "").toLowerCase();
                if (n.startsWith("on") || v.startsWith("javascript:") || v.startsWith("data:text/html"))
                    el.removeAttribute(a.name);
            });
            el.childNodes.forEach((c) => { if (c.nodeType === 1)
                walk(c); });
        };
        doc.body.querySelectorAll("*").forEach(walk);
        return doc.body.innerHTML || "";
    }
    catch {
        return "";
    }
}
electron_1.contextBridge.exposeInMainWorld("Sanitize", {
    html: (raw) => simpleSanitizeHTML(raw)
});
electron_1.contextBridge.exposeInMainWorld("Secrets", {
    migrate: () => electron_1.ipcRenderer.invoke("secrets.migrate")
});
