export default function Licenses(){
  const page = async ()=>{
    const list = await (window as any).Licenses.summary().catch(()=>[]);
    const header = { type:"div", props:{ className:"grid grid-cols-5 gap-2 font-medium", children:["License","Seats Total","Used","Verified","Revoked"] }};
    const rows = (list||[]).map((x:any)=>({ type:"div", props:{ className:"grid grid-cols-5 gap-2 p-2 rounded-2xl shadow",
      children:[ String(x.license), String(x.seatsTotal), String(x.seatsUsed), x.verified?"✔":"✖", String(x.revokedCount) ] } }));
    return { type:"div", props:{ className:"p-4 grid gap-2", children:[
      { type:"div", props:{ className:"font-semibold", children:"Licenses" }},
      header, ...rows
    ]}};
  };
  return { type:"div", props:{ children: page() } };
}
