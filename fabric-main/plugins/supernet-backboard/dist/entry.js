var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// plugins/supernet-backboard/src/routes/Apps.tsx
var Apps_exports = {};
__export(Apps_exports, {
  default: () => Apps
});
function Apps() {
  const render = async () => {
    try {
      const list = await window.PluginRegistry?.list?.() || [];
      const rows = (list || []).map((p) => ({
        type: "div",
        props: {
          className: "grid grid-cols-6 gap-2 p-2 items-center text-sm",
          children: [
            { type: "div", props: { children: p.id } },
            { type: "div", props: { children: p.name } },
            { type: "div", props: { children: p.path } },
            { type: "div", props: { children: String(p.enabled !== false) } },
            { type: "div", props: { children: p.version || "" } },
            { type: "div", props: {
              className: "flex gap-2",
              children: [
                { type: "button", props: { className: "rounded-2xl shadow px-2 py-1", onClick: async () => {
                  try {
                    await window.PluginsAdmin.enable(p.id, !(p.enabled !== false));
                    location.reload();
                  } catch (e) {
                    alert(String(e?.message || e));
                  }
                }, children: p.enabled !== false ? "Disable" : "Enable" } },
                { type: "button", props: { className: "rounded-2xl shadow px-2 py-1", onClick: async () => {
                  try {
                    await window.PluginsAdmin.remove(p.id);
                    location.reload();
                  } catch (e) {
                    alert(String(e?.message || e));
                  }
                }, children: "Remove" } }
              ]
            } }
          ]
        }
      }));
      const header = { type: "div", props: {
        className: "grid grid-cols-6 gap-2 p-2 font-semibold",
        children: ["ID", "Name", "Entry", "Enabled", "Version", "Actions"].map((t) => ({ type: "div", props: { children: t } }))
      } };
      return { type: "div", props: { className: "p-4 grid gap-4", children: [
        { type: "div", props: { className: "rounded-2xl shadow p-4 grid gap-3", children: [
          { type: "div", props: { className: "text-xl font-semibold", children: "Installed Plugins" } },
          header,
          { type: "div", props: { className: "grid gap-1", children: rows } }
        ] } }
      ] } };
    } catch (e) {
      return { type: "div", props: { className: "p-4 text-red-600 text-sm", children: String(e?.message || e) } };
    }
  };
  return { type: "div", props: { children: render() } };
}
var init_Apps = __esm({
  "plugins/supernet-backboard/src/routes/Apps.tsx"() {
  }
});

// plugins/supernet-backboard/src/routes/Compliance.tsx
var Compliance_exports = {};
__export(Compliance_exports, {
  default: () => Compliance
});
function Compliance() {
  const load = async () => {
    const state = await window.LBrain.status().catch(() => ({ status: "down" }));
    const ok = state?.status === "connected";
    const verify = async () => {
      const files = (document.getElementById("files")?.value || "").split(/\s*,\s*/).filter(Boolean);
      const expected = document.getElementById("digest")?.value || "";
      const tool = document.getElementById("tool")?.value || "";
      try {
        const r = await window.Compliance.verify(files, expected, tool);
        document.getElementById("cmp").textContent = JSON.stringify(r);
      } catch (e) {
        document.getElementById("cmp").textContent = String(e?.message || e);
      }
    };
    const ctl = (id, ph) => ({ type: "input", props: { id, placeholder: ph, className: "rounded-2xl p-2 shadow w-full" } });
    return { type: "div", props: { className: "p-4 grid gap-4", children: [
      { type: "div", props: { className: "rounded-2xl shadow p-3", children: `Language Brain: ${state?.status || "down"}` } },
      { type: "div", props: { className: "rounded-2xl shadow p-4 grid gap-2", children: [
        { type: "div", props: { className: "text-xl font-semibold", children: "Attestation Verify" } },
        ctl("files", "Comma-separated file paths (relative to project root)"),
        ctl("digest", "Expected SHA-256 (optional)"),
        ctl("tool", "toolchainId (optional)"),
        { type: "button", props: { className: "rounded-2xl shadow px-3 py-2 w-max", onClick: verify, children: "Verify" } },
        { type: "div", props: { id: "cmp", className: "text-xs text-muted-foreground break-all" } }
      ] } },
      ok ? null : { type: "div", props: { className: "rounded-2xl p-3 text-sm text-yellow-700 bg-yellow-50", children: "Degraded/Down \u2014 some ops may be blocked" } }
    ].filter(Boolean) } };
  };
  return { type: "div", props: { children: load() } };
}
var init_Compliance = __esm({
  "plugins/supernet-backboard/src/routes/Compliance.tsx"() {
  }
});

// plugins/supernet-backboard/src/routes/Logs.tsx
var Logs_exports = {};
__export(Logs_exports, {
  default: () => Logs
});
function Logs() {
  const view = async () => {
    let stop = false;
    const boxId = "logbox";
    const tick = async () => {
      if (stop) return;
      try {
        const lines = await window.Logs.tail(200);
        const el = document.getElementById(boxId);
        if (el) el.textContent = (lines || []).join("\n");
      } catch {
      }
      setTimeout(tick, 2e3);
    };
    setTimeout(tick, 300);
    const verify = async () => {
      const p = document.getElementById("file")?.value || "";
      const r = await window.Logs.verifyFile(p);
      document.getElementById("ver").textContent = JSON.stringify(r);
    };
    return {
      type: "div",
      props: { className: "p-4 grid gap-4", children: [
        { type: "div", props: { className: "rounded-2xl shadow p-3 text-sm", children: [
          { type: "div", props: { className: "font-semibold mb-2", children: "Live (tail 200)" } },
          { type: "pre", props: { id: boxId, className: "text-xs whitespace-pre-wrap break-all h-64 overflow-auto", children: "" } }
        ] } },
        { type: "div", props: { className: "rounded-2xl shadow p-3 grid gap-2", children: [
          { type: "div", props: { className: "font-semibold", children: "Verify Exported File" } },
          { type: "input", props: { id: "file", placeholder: "Path to .ndjson", className: "rounded-2xl p-2 shadow w-full" } },
          { type: "div", props: { className: "flex gap-2", children: [
            { type: "button", props: { className: "rounded-2xl shadow px-3 py-2", onClick: verify, children: "Verify" } },
            { type: "button", props: { className: "rounded-2xl shadow px-3 py-2", onClick: async () => {
              const r = await window.Audit.exportToday();
              document.getElementById("ver").textContent = JSON.stringify(r);
            }, children: "Export Today" } }
          ] } },
          { type: "div", props: { id: "ver", className: "text-xs text-muted-foreground break-all" } }
        ] } }
      ] }
    };
  };
  return { type: "div", props: { children: view() } };
}
var init_Logs = __esm({
  "plugins/supernet-backboard/src/routes/Logs.tsx"() {
  }
});

// plugins/supernet-backboard/src/routes/Devices.tsx
var Devices_exports = {};
__export(Devices_exports, {
  default: () => Devices
});
function Devices() {
  const view = async () => {
    const list = await window.Devices.list();
    const rows = (list || []).map((d) => ({ type: "div", props: {
      className: "grid grid-cols-4 gap-2 p-2 text-sm",
      children: [d.id, d.name || "", d.joined_at || "", JSON.stringify(d.policy || {})].map((x) => ({ type: "div", props: { children: String(x || "") } }))
    } }));
    setTimeout(() => {
      window.Devices.onUpdate((ls) => {
        location.reload();
      });
    }, 200);
    return { type: "div", props: { className: "p-4 grid gap-2", children: [
      { type: "div", props: { className: "font-semibold", children: "Devices" } },
      { type: "div", props: { className: "grid gap-1", children: rows } }
    ] } };
  };
  return { type: "div", props: { children: view() } };
}
var init_Devices = __esm({
  "plugins/supernet-backboard/src/routes/Devices.tsx"() {
  }
});

// plugins/supernet-backboard/src/routes/Enroll.tsx
var Enroll_exports = {};
__export(Enroll_exports, {
  default: () => Enroll
});
function Enroll() {
  const page = async () => {
    const refresh = async () => {
      const rs = await window.Enroll.list();
      document.getElementById("q").textContent = JSON.stringify(rs);
    };
    setTimeout(refresh, 100);
    return { type: "div", props: { className: "p-4 grid gap-2", children: [
      { type: "div", props: { className: "font-semibold", children: "Enrollment Queue" } },
      { type: "div", props: { id: "q", className: "text-xs break-all" } },
      { type: "div", props: { className: "flex gap-2", children: [
        { type: "input", props: { id: "fp", placeholder: "fingerprint", className: "rounded-2xl p-2 shadow" } },
        { type: "input", props: { id: "name", placeholder: "name", className: "rounded-2xl p-2 shadow" } },
        { type: "button", props: { className: "rounded-2xl shadow px-2", onClick: async () => {
          const fp = document.getElementById("fp").value;
          const nm = document.getElementById("name").value;
          await window.Enroll.approve(fp, nm);
          location.reload();
        }, children: "Approve" } },
        { type: "button", props: { className: "rounded-2xl shadow px-2", onClick: async () => {
          const fp = document.getElementById("fp").value;
          await window.Enroll.deny(fp);
          location.reload();
        }, children: "Deny" } }
      ] } }
    ] } };
  };
  return { type: "div", props: { children: page() } };
}
var init_Enroll = __esm({
  "plugins/supernet-backboard/src/routes/Enroll.tsx"() {
  }
});

// plugins/supernet-backboard/src/routes/Licenses.tsx
var Licenses_exports = {};
__export(Licenses_exports, {
  default: () => Licenses
});
function Licenses() {
  const page = async () => {
    const sum = await window.Licenses.summary();
    const rows = (sum || []).map((s) => ({ type: "div", props: {
      className: "grid grid-cols-3 gap-2 p-2 text-sm",
      children: [s.license, String(s.seatsUsed), (s.claims || []).join(",")].map((x) => ({ type: "div", props: { children: String(x || "") } }))
    } }));
    return { type: "div", props: { className: "p-4 grid gap-2", children: [
      { type: "div", props: { className: "font-semibold", children: "Licenses" } },
      { type: "div", props: { className: "grid gap-1", children: rows } },
      { type: "div", props: { className: "flex gap-2", children: [
        { type: "input", props: { id: "lic", placeholder: "licenseId", className: "rounded-2xl p-2 shadow" } },
        { type: "input", props: { id: "fp", placeholder: "deviceFp", className: "rounded-2xl p-2 shadow" } },
        { type: "button", props: { className: "rounded-2xl shadow px-2", onClick: async () => {
          const lic = document.getElementById("lic").value;
          const fp = document.getElementById("fp").value;
          await window.Licenses.activate(lic, fp);
          location.reload();
        }, children: "Activate" } },
        { type: "button", props: { className: "rounded-2xl shadow px-2", onClick: async () => {
          const lic = document.getElementById("lic").value;
          const fp = document.getElementById("fp").value;
          await window.Licenses.deactivate(lic, fp);
          location.reload();
        }, children: "Deactivate" } }
      ] } }
    ] } };
  };
  return { type: "div", props: { children: page() } };
}
var init_Licenses = __esm({
  "plugins/supernet-backboard/src/routes/Licenses.tsx"() {
  }
});

// plugins/supernet-backboard/src/routes/Settings.tsx
var Settings_exports = {};
__export(Settings_exports, {
  default: () => Settings
});
function Settings() {
  const page = async () => {
    const st = await window.Auth.status().catch(() => ({ ok: false }));
    const setPass = async () => {
      const c = document.getElementById("pc").value;
      await window.Auth.setPasscode(c);
      alert("Passcode set");
    };
    const login = async () => {
      const c = document.getElementById("pc").value;
      const r = await window.Auth.login(c);
      alert("Login: " + (r.ok ? "OK" : "FAIL"));
    };
    const setLb = async () => {
      const u = document.getElementById("lb").value;
      await window.LBrain.setUrl(u);
      alert("Saved");
    };
    return { type: "div", props: { className: "p-4 grid gap-3", children: [
      { type: "div", props: { className: "font-semibold", children: "Settings" } },
      { type: "div", props: { className: "grid gap-2", children: [
        { type: "input", props: { id: "pc", placeholder: "passcode", className: "rounded-2xl p-2 shadow" } },
        { type: "div", props: { className: "flex gap-2", children: [
          { type: "button", props: { className: "rounded-2xl shadow px-2", onClick: setPass, children: "Set Passcode" } },
          { type: "button", props: { className: "rounded-2xl shadow px-2", onClick: login, children: "Login" } },
          { type: "div", props: { children: "Status: " + String(st.ok) } }
        ] } }
      ] } },
      { type: "div", props: { className: "grid gap-2", children: [
        { type: "input", props: { id: "lb", placeholder: "LBRAIN URL (e.g. http://127.0.0.1:8891)", className: "rounded-2xl p-2 shadow" } },
        { type: "button", props: { className: "rounded-2xl shadow px-2 w-max", onClick: setLb, children: "Save LB URL" } }
      ] } }
    ] } };
  };
  return { type: "div", props: { children: page() } };
}
var init_Settings = __esm({
  "plugins/supernet-backboard/src/routes/Settings.tsx"() {
  }
});

// plugins/supernet-backboard/src/entry.ts
async function Entry() {
  const link = (h, l) => ({ type: "a", props: { href: "#" + h, className: "px-2 py-1 rounded-2xl shadow", children: l } });
  const route = async () => {
    const h = typeof location !== "undefined" ? location.hash.replace(/^#/, "") : "";
    if (h.startsWith("/apps")) return (await Promise.resolve().then(() => (init_Apps(), Apps_exports))).default();
    if (h.startsWith("/compliance")) return (await Promise.resolve().then(() => (init_Compliance(), Compliance_exports))).default();
    if (h.startsWith("/logs")) return (await Promise.resolve().then(() => (init_Logs(), Logs_exports))).default();
    if (h.startsWith("/devices")) return (await Promise.resolve().then(() => (init_Devices(), Devices_exports))).default();
    if (h.startsWith("/enroll")) return (await Promise.resolve().then(() => (init_Enroll(), Enroll_exports))).default();
    if (h.startsWith("/licenses")) return (await Promise.resolve().then(() => (init_Licenses(), Licenses_exports))).default();
    if (h.startsWith("/settings")) return (await Promise.resolve().then(() => (init_Settings(), Settings_exports))).default();
    return { type: "div", props: { className: "p-4 grid gap-2", children: [
      { type: "div", props: { children: "SuperNet Backboard" } }
    ] } };
  };
  const shell = async () => ({ type: "div", props: { className: "p-3 grid gap-3", children: [
    { type: "div", props: { className: "flex gap-2", children: [
      link("/apps", "Apps"),
      link("/devices", "Devices"),
      link("/enroll", "Enroll"),
      link("/licenses", "Licenses"),
      link("/logs", "Logs"),
      link("/compliance", "Compliance"),
      link("/settings", "Settings")
    ] } },
    await route()
  ] } });
  addEventListener("hashchange", () => location.reload());
  return shell();
}
export {
  Entry as default
};
