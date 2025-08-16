export default function Apps(){
  const render = async () => {
    try{
      const list = await (window as any).PluginRegistry?.list?.() || [];
      const rows = (list||[]).map((p:any)=>({
        type:"div", props:{ className:"grid grid-cols-6 gap-2 p-2 items-center text-sm",
          children:[
            {type:"div", props:{children:p.id}},
            {type:"div", props:{children:p.name}},
            {type:"div", props:{children:p.path}},
            {type:"div", props:{children:String(p.enabled!==false)}},
            {type:"div", props:{children:p.version||""}},
            {type:"div", props:{ className:"flex gap-2",
              children:[
                {type:"button", props:{ className:"rounded-2xl shadow px-2 py-1", onClick: async ()=>{
                  try{ await (window as any).PluginsAdmin.enable(p.id, !(p.enabled!==false)); location.reload(); }
                  catch(e:any){ alert(String(e?.message||e)); }
                }, children:(p.enabled!==false)?"Disable":"Enable" }},
                {type:"button", props:{ className:"rounded-2xl shadow px-2 py-1", onClick: async ()=>{
                  try{ await (window as any).PluginsAdmin.remove(p.id); location.reload(); }
                  catch(e:any){ alert(String(e?.message||e)); }
                }, children:"Remove" }}
              ]
            }}
          ]
        }
      }));
      const header = { type:"div", props:{ className:"grid grid-cols-6 gap-2 p-2 font-semibold",
        children:["ID","Name","Entry","Enabled","Version","Actions"].map(t=>({type:"div", props:{children:t}}))
      }};
      return { type:"div", props:{ className:"p-4 grid gap-4", children:[
        { type:"div", props:{ className:"rounded-2xl shadow p-4 grid gap-3", children:[
          {type:"div", props:{className:"text-xl font-semibold", children:"Installed Plugins"}},
          header, {type:"div", props:{className:"grid gap-1", children:rows}}
        ]}}
      ]}};
    }catch(e:any){
      return { type:"div", props:{ className:"p-4 text-red-600 text-sm", children:String(e?.message||e) } };
    }
  };
  return { type:"div", props:{ children: render() } };
}
