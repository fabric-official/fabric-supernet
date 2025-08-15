function m() {
  return { type: "div", props: { children: (async () => {
    const e = await window.LBrain.status().catch(() => ({ status: "down" })), p = (e == null ? void 0 : e.status) === "connected", c = async () => {
      var s, a, d;
      const n = (((s = document.getElementById("files")) == null ? void 0 : s.value) || "").split(/\s*,\s*/).filter(Boolean), l = ((a = document.getElementById("digest")) == null ? void 0 : a.value) || "", i = ((d = document.getElementById("tool")) == null ? void 0 : d.value) || "";
      try {
        const t = await window.Compliance.verify(n, l, i);
        document.getElementById("cmp").textContent = JSON.stringify(t);
      } catch (t) {
        document.getElementById("cmp").textContent = String((t == null ? void 0 : t.message) || t);
      }
    }, o = (n, l) => ({ type: "input", props: { id: n, placeholder: l, className: "rounded-2xl p-2 shadow w-full" } });
    return { type: "div", props: { className: "p-4 grid gap-4", children: [
      { type: "div", props: { className: "rounded-2xl shadow p-3", children: `Language Brain: ${(e == null ? void 0 : e.status) || "down"}` } },
      { type: "div", props: { className: "rounded-2xl shadow p-4 grid gap-2", children: [
        { type: "div", props: { className: "text-xl font-semibold", children: "Attestation Verify" } },
        o("files", "Comma-separated file paths (relative to project root)"),
        o("digest", "Expected SHA-256 (optional)"),
        o("tool", "toolchainId (optional)"),
        { type: "button", props: { className: "rounded-2xl shadow px-3 py-2 w-max", onClick: c, children: "Verify" } },
        { type: "div", props: { id: "cmp", className: "text-xs text-muted-foreground break-all" } }
      ] } },
      p ? null : { type: "div", props: { className: "rounded-2xl p-3 text-sm text-yellow-700 bg-yellow-50", children: "Degraded/Down — some ops may be blocked" } }
    ].filter(Boolean) } };
  })() } };
}
export {
  m as default
};
