export default function Enroll(){
  const page=async()=>{
    const refresh=async()=>{ const rs=await (window as any).Enroll.list(); (document.getElementById("q") as HTMLElement).textContent=JSON.stringify(rs); };
    setTimeout(refresh,100);
    return { type:"div", props:{ className:"p-4 grid gap-2", children:[
      { type:"div", props:{ className:"font-semibold", children:"Enrollment Queue" } },
      { type:"div", props:{ id:"q", className:"text-xs break-all" }},
      { type:"div", props:{ className:"flex gap-2", children:[
        { type:"input", props:{ id:"fp", placeholder:"fingerprint", className:"rounded-2xl p-2 shadow" }},
        { type:"input", props:{ id:"name", placeholder:"name", className:"rounded-2xl p-2 shadow" }},
        { type:"button", props:{ className:"rounded-2xl shadow px-2", onClick: async()=>{ const fp=(document.getElementById("fp") as HTMLInputElement).value; const nm=(document.getElementById("name") as HTMLInputElement).value; await (window as any).Enroll.approve(fp,nm); location.reload(); }, children:"Approve" }},
        { type:"button", props:{ className:"rounded-2xl shadow px-2", onClick: async()=>{ const fp=(document.getElementById("fp") as HTMLInputElement).value; await (window as any).Enroll.deny(fp); location.reload(); }, children:"Deny" }}
      ]}}
    ]}};
  };
  return { type:"div", props:{ children: page() } };
}
