import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("Auth", {
  setPasscode: (code) => ipcRenderer.invoke("auth.setPasscode", { code }),
  login: (code) => ipcRenderer.invoke("auth.login", { code }),
  status: () => ipcRenderer.invoke("auth.status")
});

contextBridge.exposeInMainWorld("LBrain", {
  status: () => ipcRenderer.invoke("lbrain.status"),
  setUrl: (url) => ipcRenderer.invoke("lbrain.setUrl", { url })
});

contextBridge.exposeInMainWorld("PluginRegistry", {
  list: () => ipcRenderer.invoke("fabric.plugins.list"),
  installLocal: (folder) => ipcRenderer.invoke("fabric.plugins.installLocal", { folder }),
  installFromUrl: (info) => ipcRenderer.invoke("fabric.plugins.installFromUrl", info),
  onChanged: (fn) => { ipcRenderer.on("fabric.plugins.changed", (_e, data)=>fn(data)); return ()=>ipcRenderer.removeAllListeners("fabric.plugins.changed"); }
});
contextBridge.exposeInMainWorld("PluginsAdmin", {
  enable: (id, enabled) => ipcRenderer.invoke("fabric.plugins.enable", { id, enabled }),
  remove: (id) => ipcRenderer.invoke("fabric.plugins.remove", { id }),
  cleanup: () => ipcRenderer.invoke("fabric.plugins.cleanup")
});

contextBridge.exposeInMainWorld("GitAdmin", {
  setConfig: (url, branch, username, password) => ipcRenderer.invoke("git.config.set", { url, branch, username, password }),
  pull: () => ipcRenderer.invoke("git.pull"),
  push: () => ipcRenderer.invoke("git.push")
});

contextBridge.exposeInMainWorld("Compliance", {
  verify: (files, expectedDigest, toolchainId) => ipcRenderer.invoke("attest.verify", { files, expectedDigest, toolchainId })
});

contextBridge.exposeInMainWorld("Runtime", {
  call: (cmd, args) => ipcRenderer.invoke("fabric.runtime.invoke", { cmd, args })
});

contextBridge.exposeInMainWorld("Logs", {
  tail: (count) => ipcRenderer.invoke("logs.tail", { count }),
  verifyFile: (file) => ipcRenderer.invoke("logs.verify.file", { file })
});

contextBridge.exposeInMainWorld("Audit", {
  exportToday: () => ipcRenderer.invoke("audit.export.today")
});

contextBridge.exposeInMainWorld("Devices", {
  list: () => ipcRenderer.invoke("device.list"),
  detail: (id) => ipcRenderer.invoke("device.detail", { id }),
  rename: (id, name) => ipcRenderer.invoke("device.rename", { id, name }),
  remove: (id) => ipcRenderer.invoke("device.remove", { id }),
  onUpdate: (fn) => { ipcRenderer.on("devices.update", (_e, data)=>fn(data)); return ()=>ipcRenderer.removeAllListeners("devices.update"); }
});

contextBridge.exposeInMainWorld("Enroll", {
  challenge: (fp) => ipcRenderer.invoke("enroll.challenge", { fp }),
  request: (fp, pub, proof) => ipcRenderer.invoke("enroll.request", { fp, pub, proof }),
  list: () => ipcRenderer.invoke("enroll.list"),
  approve: (fp, name) => ipcRenderer.invoke("enroll.approve", { fp, name }),
  deny: (fp) => ipcRenderer.invoke("enroll.deny", { fp })
});

contextBridge.exposeInMainWorld("Licenses", {
  activate: (licenseId, deviceFp) => ipcRenderer.invoke("license.activate", { licenseId, deviceFp }),
  deactivate: (licenseId, deviceFp) => ipcRenderer.invoke("license.deactivate", { licenseId, deviceFp }),
  summary: () => ipcRenderer.invoke("license.summary")
});

contextBridge.exposeInMainWorld("Telemetry", {
  set: (enabled) => ipcRenderer.invoke("telemetry.set", { enabled })
});
contextBridge.exposeInMainWorld("LogCtrl", {
  setLevel: (level) => ipcRenderer.invoke("log.level.set", { level })
});
contextBridge.exposeInMainWorld("Updates", {
  check: () => ipcRenderer.invoke("updates.check"),
  quitAndInstall: () => ipcRenderer.invoke("updates.quitInstall")
});
contextBridge.exposeInMainWorld("SiteSetup", {
  run: (wallet) => ipcRenderer.invoke("site.setup", { wallet })
});try {
  // TrustedTypes default policy (no-op passthrough; rely on Sanitize.html for HTML sinks)
  (window as any).trustedTypes?.createPolicy?.("default", {
    createHTML: (s: string) => s
  });
} catch {}
function simpleSanitizeHTML(input: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(String(input||""), "text/html");
    // remove scripts and styles
    doc.querySelectorAll("script,style").forEach(n=>n.remove());
    // strip on* attributes and dangerous hrefs/src
    const walk = (el: Element) => {
      [...el.attributes].forEach(a=>{
        const n = a.name.toLowerCase();
        const v = (a.value||"").toLowerCase();
        if (n.startsWith("on") || v.startsWith("javascript:") || v.startsWith("data:text/html")) el.removeAttribute(a.name);
      });
      el.childNodes.forEach((c)=>{ if (c.nodeType===1) walk(c as Element); });
    };
    doc.body.querySelectorAll("*").forEach(walk);
    return doc.body.innerHTML || "";
  } catch { return ""; }
}
contextBridge.exposeInMainWorld("Sanitize", {
  html: (raw: string) => simpleSanitizeHTML(raw)
});contextBridge.exposeInMainWorld("Secrets", {
  migrate: () => ipcRenderer.invoke("secrets.migrate")
});