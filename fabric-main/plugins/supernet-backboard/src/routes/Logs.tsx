export default function Logs(){
  const view = async ()=>{
    let stop=false;
    const boxId="logbox";
    const tick = async ()=>{
      if (stop) return;
      try{
        const lines = await (window as any).Logs.tail(200);
        const el = document.getElementById(boxId);
        if (el) el.textContent = (lines||[]).join("\n");
      }catch{}
      setTimeout(tick, 2000);
    };
    setTimeout(tick, 300);
    const verify = async ()=>{
      const p = (document.getElementById("file") as HTMLInputElement)?.value||"";
      const r = await (window as any).Logs.verifyFile(p);
      (document.getElementById("ver") as HTMLElement).textContent = JSON.stringify(r);
    };
    return {
      type:"div", props:{ className:"p-4 grid gap-4", children:[
        { type:"div", props:{ className:"rounded-2xl shadow p-3 text-sm", children:[
          { type:"div", props:{ className:"font-semibold mb-2", children:"Live (tail 200)"} },
          { type:"pre", props:{ id:boxId, className:"text-xs whitespace-pre-wrap break-all h-64 overflow-auto", children:"" } }
        ]}},
        { type:"div", props:{ className:"rounded-2xl shadow p-3 grid gap-2", children:[
          { type:"div", props:{ className:"font-semibold", children:"Verify Exported File"} },
          { type:"input", props:{ id:"file", placeholder:"Path to .ndjson", className:"rounded-2xl p-2 shadow w-full" } },
          { type:"div", props:{ className:"flex gap-2", children:[
            { type:"button", props:{ className:"rounded-2xl shadow px-3 py-2", onClick: verify, children:"Verify" }},
            { type:"button", props:{ className:"rounded-2xl shadow px-3 py-2", onClick: async ()=>{
              const r = await (window as any).Audit.exportToday();
              (document.getElementById("ver") as HTMLElement).textContent = JSON.stringify(r);
            }, children:"Export Today" }}
          ]}},
          { type:"div", props:{ id:"ver", className:"text-xs text-muted-foreground break-all" } }
        ]}}
      ]}
    };
  };
  return { type:"div", props:{ children: view() } };
}
