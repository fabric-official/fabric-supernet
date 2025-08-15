function r() {
  return { type: "div", props: { children: (async () => {
    const o = "logbox", s = async () => {
      try {
        const e = await window.Logs.tail(200), t = document.getElementById(o);
        t && (t.textContent = (e || []).join(`
`));
      } catch {
      }
      setTimeout(s, 2e3);
    };
    return setTimeout(s, 300), {
      type: "div",
      props: { className: "p-4 grid gap-4", children: [
        { type: "div", props: { className: "rounded-2xl shadow p-3 text-sm", children: [
          { type: "div", props: { className: "font-semibold mb-2", children: "Live (tail 200)" } },
          { type: "pre", props: { id: o, className: "text-xs whitespace-pre-wrap break-all h-64 overflow-auto", children: "" } }
        ] } },
        { type: "div", props: { className: "rounded-2xl shadow p-3 grid gap-2", children: [
          { type: "div", props: { className: "font-semibold", children: "Verify Exported File" } },
          { type: "input", props: { id: "file", placeholder: "Path to .ndjson", className: "rounded-2xl p-2 shadow w-full" } },
          { type: "div", props: { className: "flex gap-2", children: [
            { type: "button", props: { className: "rounded-2xl shadow px-3 py-2", onClick: async () => {
              var n;
              const e = ((n = document.getElementById("file")) == null ? void 0 : n.value) || "", t = await window.Logs.verifyFile(e);
              document.getElementById("ver").textContent = JSON.stringify(t);
            }, children: "Verify" } },
            { type: "button", props: { className: "rounded-2xl shadow px-3 py-2", onClick: async () => {
              const e = await window.Audit.exportToday();
              document.getElementById("ver").textContent = JSON.stringify(e);
            }, children: "Export Today" } }
          ] } },
          { type: "div", props: { id: "ver", className: "text-xs text-muted-foreground break-all" } }
        ] } }
      ] }
    };
  })() } };
}
export {
  r as default
};
