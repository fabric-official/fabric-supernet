export default function Licenses(){
  const page=async()=>{
    const sum = await (window as any).Licenses.summary();
    const rows=(sum||[]).map((s:any)=>({type:"div",props:{className:"grid grid-cols-3 gap-2 p-2 text-sm",
      children:[s.license, String(s.seatsUsed), (s.claims||[]).join(",")].map(x=>({type:"div",props:{children:String(x||"")}}))}}));
    return { type:"div", props:{ className:"p-4 grid gap-2", children:[
      { type:"div", props:{ className:"font-semibold", children:"Licenses" }},
      { type:"div", props:{ className:"grid gap-1", children:rows }},
      { type:"div", props:{ className:"flex gap-2", children:[
        { type:"input", props:{ id:"lic", placeholder:"licenseId", className:"rounded-2xl p-2 shadow" }},
        { type:"input", props:{ id:"fp", placeholder:"deviceFp", className:"rounded-2xl p-2 shadow" }},
        { type:"button", props:{ className:"rounded-2xl shadow px-2", onClick: async()=>{ const lic=(document.getElementById("lic") as HTMLInputElement).value; const fp=(document.getElementById("fp") as HTMLInputElement).value; await (window as any).Licenses.activate(lic,fp); location.reload(); }, children:"Activate" }},
        { type:"button", props:{ className:"rounded-2xl shadow px-2", onClick: async()=>{ const lic=(document.getElementById("lic") as HTMLInputElement).value; const fp=(document.getElementById("fp") as HTMLInputElement).value; await (window as any).Licenses.deactivate(lic,fp); location.reload(); }, children:"Deactivate" }}
      ]}}
    ]}};
  };
  return { type:"div", props:{ children: page() } };
}
