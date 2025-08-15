function a() {
  return { type: "div", props: { children: (async () => (setTimeout(async () => {
    const e = await window.Enroll.list();
    document.getElementById("q").textContent = JSON.stringify(e);
  }, 100), { type: "div", props: { className: "p-4 grid gap-2", children: [
    { type: "div", props: { className: "font-semibold", children: "Enrollment Queue" } },
    { type: "div", props: { id: "q", className: "text-xs break-all" } },
    { type: "div", props: { className: "flex gap-2", children: [
      { type: "input", props: { id: "fp", placeholder: "fingerprint", className: "rounded-2xl p-2 shadow" } },
      { type: "input", props: { id: "name", placeholder: "name", className: "rounded-2xl p-2 shadow" } },
      { type: "button", props: { className: "rounded-2xl shadow px-2", onClick: async () => {
        const e = document.getElementById("fp").value, n = document.getElementById("name").value;
        await window.Enroll.approve(e, n), location.reload();
      }, children: "Approve" } },
      { type: "button", props: { className: "rounded-2xl shadow px-2", onClick: async () => {
        const e = document.getElementById("fp").value;
        await window.Enroll.deny(e), location.reload();
      }, children: "Deny" } }
    ] } }
  ] } }))() } };
}
export {
  a as default
};
