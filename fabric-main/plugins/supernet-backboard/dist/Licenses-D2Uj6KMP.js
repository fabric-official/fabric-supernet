function p() {
  return { type: "div", props: { children: (async () => {
    const a = (await window.Licenses.summary() || []).map((e) => ({ type: "div", props: {
      className: "grid grid-cols-3 gap-2 p-2 text-sm",
      children: [e.license, String(e.seatsUsed), (e.claims || []).join(",")].map((s) => ({ type: "div", props: { children: String(s || "") } }))
    } }));
    return { type: "div", props: { className: "p-4 grid gap-2", children: [
      { type: "div", props: { className: "font-semibold", children: "Licenses" } },
      { type: "div", props: { className: "grid gap-1", children: a } },
      { type: "div", props: { className: "flex gap-2", children: [
        { type: "input", props: { id: "lic", placeholder: "licenseId", className: "rounded-2xl p-2 shadow" } },
        { type: "input", props: { id: "fp", placeholder: "deviceFp", className: "rounded-2xl p-2 shadow" } },
        { type: "button", props: { className: "rounded-2xl shadow px-2", onClick: async () => {
          const e = document.getElementById("lic").value, s = document.getElementById("fp").value;
          await window.Licenses.activate(e, s), location.reload();
        }, children: "Activate" } },
        { type: "button", props: { className: "rounded-2xl shadow px-2", onClick: async () => {
          const e = document.getElementById("lic").value, s = document.getElementById("fp").value;
          await window.Licenses.deactivate(e, s), location.reload();
        }, children: "Deactivate" } }
      ] } }
    ] } };
  })() } };
}
export {
  p as default
};
