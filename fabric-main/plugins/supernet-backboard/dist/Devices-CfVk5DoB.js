function r() {
  return { type: "div", props: { children: (async () => {
    const i = (await window.Devices.list() || []).map((e) => ({ type: "div", props: {
      className: "grid grid-cols-4 gap-2 p-2 text-sm",
      children: [e.id, e.name || "", e.joined_at || "", JSON.stringify(e.policy || {})].map((s) => ({ type: "div", props: { children: String(s || "") } }))
    } }));
    return setTimeout(() => {
      window.Devices.onUpdate((e) => {
        location.reload();
      });
    }, 200), { type: "div", props: { className: "p-4 grid gap-2", children: [
      { type: "div", props: { className: "font-semibold", children: "Devices" } },
      { type: "div", props: { className: "grid gap-1", children: i } }
    ] } };
  })() } };
}
export {
  r as default
};
