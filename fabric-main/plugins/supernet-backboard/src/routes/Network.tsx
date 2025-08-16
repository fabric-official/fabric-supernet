export default function Network({ host }: any){
  const state:any = { qr:null, ssid:"", msg:"" };
  const onCreate = async (e?:any) => {
    try {
      const res = await host.runtime.invoke("network.create", { name: state.ssid, psk: (document.getElementById("psk") as HTMLInputElement)?.value || "" });
      state.qr = res?.qr || null; state.msg = res?.ok ? "Network created" : "Failed";
      (document.getElementById("qrimg") as HTMLImageElement)?.setAttribute("src", state.qr || "");
      (document.getElementById("msg") as HTMLElement).textContent = state.msg || "";
    } catch (err:any) { (document.getElementById("msg") as HTMLElement).textContent = String(err?.message || err) }
  };
  const form = { type:"div", props:{ className:"rounded-2xl shadow p-4 grid gap-3",
    children:[
      { type:"div", props:{ className:"text-xl font-semibold", children:"Create Wi-Fi Network" }},
      { type:"div", props:{ className:"grid md:grid-cols-2 gap-3",
        children:[
          { type:"input", props:{ id:"ssid", placeholder:"Network name (SSID)", className:"rounded-2xl p-2 shadow", onInput:(e:any)=>{state.ssid=e.target.value;} } },
          { type:"input", props:{ id:"psk", type:"password", placeholder:"Password (PSK)", className:"rounded-2xl p-2 shadow" } }
        ]
      }},
      { type:"button", props:{ className:"rounded-2xl shadow p-2 w-max", onClick:onCreate, children:"Create + Generate QR" }},
      { type:"div", props:{ id:"msg", className:"text-sm text-muted-foreground" }},
      { type:"img", props:{ id:"qrimg", className:"mt-2 w-auto h-40 rounded-2xl shadow", src:"" }}
    ]}}
  };
  return { type:"div", props:{ className:"p-4 grid gap-4", children:[ form ] } };
}
