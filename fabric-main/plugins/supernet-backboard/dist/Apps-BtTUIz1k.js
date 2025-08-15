function l() {
  return { type: "div", props: { children: (async () => {
    var i, d;
    try {
      const a = (await ((d = (i = window.PluginRegistry) == null ? void 0 : i.list) == null ? void 0 : d.call(i)) || [] || []).map((e) => ({
        type: "div",
        props: {
          className: "grid grid-cols-6 gap-2 p-2 items-center text-sm",
          children: [
            { type: "div", props: { children: e.id } },
            { type: "div", props: { children: e.name } },
            { type: "div", props: { children: e.path } },
            { type: "div", props: { children: String(e.enabled !== !1) } },
            { type: "div", props: { children: e.version || "" } },
            { type: "div", props: {
              className: "flex gap-2",
              children: [
                { type: "button", props: { className: "rounded-2xl shadow px-2 py-1", onClick: async () => {
                  try {
                    await window.PluginsAdmin.enable(e.id, e.enabled === !1), location.reload();
                  } catch (s) {
                    alert(String((s == null ? void 0 : s.message) || s));
                  }
                }, children: e.enabled !== !1 ? "Disable" : "Enable" } },
                { type: "button", props: { className: "rounded-2xl shadow px-2 py-1", onClick: async () => {
                  try {
                    await window.PluginsAdmin.remove(e.id), location.reload();
                  } catch (s) {
                    alert(String((s == null ? void 0 : s.message) || s));
                  }
                }, children: "Remove" } }
              ]
            } }
          ]
        }
      })), n = { type: "div", props: {
        className: "grid grid-cols-6 gap-2 p-2 font-semibold",
        children: ["ID", "Name", "Entry", "Enabled", "Version", "Actions"].map((e) => ({ type: "div", props: { children: e } }))
      } };
      return { type: "div", props: { className: "p-4 grid gap-4", children: [
        { type: "div", props: { className: "rounded-2xl shadow p-4 grid gap-3", children: [
          { type: "div", props: { className: "text-xl font-semibold", children: "Installed Plugins" } },
          n,
          { type: "div", props: { className: "grid gap-1", children: a } }
        ] } }
      ] } };
    } catch (r) {
      return { type: "div", props: { className: "p-4 text-red-600 text-sm", children: String((r == null ? void 0 : r.message) || r) } };
    }
  })() } };
}
export {
  l as default
};
