export default function Compliance(){
  const load = async ()=>{
    const state = await (window as any).LBrain.status().catch(()=>({status:"down"}));
    const ok = state?.status==="connected";
    const verify = async ()=>{
      const files = ((document.getElementById("files") as HTMLInputElement)?.value||"").split(/\s*,\s*/).filter(Boolean);
      const expected = (document.getElementById("digest") as HTMLInputElement)?.value||"";
      const tool = (document.getElementById("tool") as HTMLInputElement)?.value||"";
      try{
        const r = await (window as any).Compliance.verify(files, expected, tool);
        (document.getElementById("cmp") as HTMLElement).textContent = JSON.stringify(r);
      }catch(e:any){ (document.getElementById("cmp") as HTMLElement).textContent = String(e?.message||e); }
    };
    const ctl = (id:string, ph:string)=>({type:"input", props:{id, placeholder:ph, className:"rounded-2xl p-2 shadow w-full"}});
    return { type:"div", props:{ className:"p-4 grid gap-4", children:[
      { type:"div", props:{ className:"rounded-2xl shadow p-3", children:`Language Brain: ${state?.status||"down"}` }},
      { type:"div", props:{ className:"rounded-2xl shadow p-4 grid gap-2", children:[
        { type:"div", props:{ className:"text-xl font-semibold", children:"Attestation Verify" }},
        ctl("files","Comma-separated file paths (relative to project root)"),
        ctl("digest","Expected SHA-256 (optional)"),
        ctl("tool","toolchainId (optional)"),
        { type:"button", props:{ className:"rounded-2xl shadow px-3 py-2 w-max", onClick:verify, children:"Verify" }},
        { type:"div", props:{ id:"cmp", className:"text-xs text-muted-foreground break-all" }}
      ]}},
      ok? null : { type:"div", props:{ className:"rounded-2xl p-3 text-sm text-yellow-700 bg-yellow-50", children:"Degraded/Down — some ops may be blocked"}}
    ].filter(Boolean)}};
  };
  return { type:"div", props:{ children: load() } };
}
