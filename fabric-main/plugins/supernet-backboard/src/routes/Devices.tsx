export default function Devices(){
  const view=async()=>{
    const list=await (window as any).Devices.list();
    const rows=(list||[]).map((d:any)=>({type:"div",props:{className:"grid grid-cols-4 gap-2 p-2 text-sm",
      children:[d.id,d.name||"",d.joined_at||"",JSON.stringify(d.policy||{})].map(x=>({type:"div",props:{children:String(x||"")}}))}}));
    setTimeout(()=>{ (window as any).Devices.onUpdate((ls:any)=>{ location.reload(); }); },200);
    return {type:"div",props:{className:"p-4 grid gap-2",children:[
      {type:"div",props:{className:"font-semibold",children:"Devices"}},
      {type:"div",props:{className:"grid gap-1",children:rows}}
    ]}};
  };
  return {type:"div",props:{children:view()}};
}
