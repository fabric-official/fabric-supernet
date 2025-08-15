function d() {
  return { type: "div", props: { children: (async () => {
    const s = await window.Auth.status().catch(() => ({ ok: !1 })), t = async () => {
      const e = document.getElementById("pc").value;
      await window.Auth.setPasscode(e), alert("Passcode set");
    }, a = async () => {
      const e = document.getElementById("pc").value, n = await window.Auth.login(e);
      alert("Login: " + (n.ok ? "OK" : "FAIL"));
    }, o = async () => {
      const e = document.getElementById("lb").value;
      await window.LBrain.setUrl(e), alert("Saved");
    };
    return { type: "div", props: { className: "p-4 grid gap-3", children: [
      { type: "div", props: { className: "font-semibold", children: "Settings" } },
      { type: "div", props: { className: "grid gap-2", children: [
        { type: "input", props: { id: "pc", placeholder: "passcode", className: "rounded-2xl p-2 shadow" } },
        { type: "div", props: { className: "flex gap-2", children: [
          { type: "button", props: { className: "rounded-2xl shadow px-2", onClick: t, children: "Set Passcode" } },
          { type: "button", props: { className: "rounded-2xl shadow px-2", onClick: a, children: "Login" } },
          { type: "div", props: { children: "Status: " + String(s.ok) } }
        ] } }
      ] } },
      { type: "div", props: { className: "grid gap-2", children: [
        { type: "input", props: { id: "lb", placeholder: "LBRAIN URL (e.g. http://127.0.0.1:8891)", className: "rounded-2xl p-2 shadow" } },
        { type: "button", props: { className: "rounded-2xl shadow px-2 w-max", onClick: o, children: "Save LB URL" } }
      ] } }
    ] } };
  })() } };
}
export {
  d as default
};
