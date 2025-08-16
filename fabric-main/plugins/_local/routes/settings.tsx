export default function Settings(){
  const page = async ()=>{
    const st = await (window as any).Auth?.status?.().catch(()=>({ok:false}));
    const disabled = !st?.ok;
    const publish = async ()=>{
      const id = (document.getElementById("agentId") as HTMLInputElement).value;
      const tc = (document.getElementById("tcId") as HTMLInputElement).value;
      const r  = await (window as any).Runtime.call("agent.publish", { id, toolchainId: tc });
      alert("Publish: " + JSON.stringify(r));
    };
    const exportA = async ()=>{
      const file = (document.getElementById("artifactFile") as HTMLInputElement).value;
      const r    = await (window as any).Runtime.call("export.artifact", { file });
      alert("Export: " + JSON.stringify(r));
    };
    const saveGit = async ()=>{
      const u  = (document.getElementById("gitUser") as HTMLInputElement).value;
      const p  = (document.getElementById("gitPass") as HTMLInputElement).value;
      const url= (document.getElementById("gitUrl")  as HTMLInputElement).value;
      const br = (document.getElementById("gitBranch") as HTMLInputElement).value || "main";
      const r  = await (window as any).GitAdmin.setConfig(url, br, u, p);
      alert("Saved: " + JSON.stringify(r));
    };
    const pull = async ()=>{ const r = await (window as any).GitAdmin.pull(); alert("Pull: " + JSON.stringify(r)); };
    const cleanup = async ()=>{ const r = await (window as any).PluginsAdmin.cleanup(); alert("Cleanup: " + JSON.stringify(r)); };
    return { type:"div", props:{ className:"p-4 grid gap-4", children:[
      !st?.ok ? { type:"div", props:{ className:"rounded-2xl p-3 bg-yellow-100 text-yellow-800", children:"Admin actions locked. Login required." }} : null,

      { type:"div", props:{ className:"font-semibold", children:"Admin Tools" }},

      { type:"div", props:{ className:"grid gap-2", children:[
        { type:"div", props:{ className:"font-medium", children:"Agent publish" }},
        { type:"input",  props:{ id:"agentId", placeholder:"agent id", className:"rounded-2xl p-2 shadow", disabled } },
        { type:"input",  props:{ id:"tcId", placeholder:"toolchain id", className:"rounded-2xl p-2 shadow", disabled } },
        { type:"button", props:{ className:"rounded-2xl shadow px-2", disabled, onClick:publish, children:"Publish" } }
      ]}},

      { type:"div", props:{ className:"grid gap-2", children:[
        { type:"div", props:{ className:"font-medium", children:"Export artifact" }},
        { type:"input",  props:{ id:"artifactFile", placeholder:"path to file", className:"rounded-2xl p-2 shadow" } },
        { type:"button", props:{ className:"rounded-2xl shadow px-2", onClick:exportA, children:"Export" } }
      ]}},

      { type:"div", props:{ className:"grid gap-2", children:[
        { type:"div", props:{ className:"font-medium", children:"Git auth + pull" }},
        { type:"input", props:{ id:"gitUrl", placeholder:"git remote url (https)", className:"rounded-2xl p-2 shadow", disabled } },
        { type:"input", props:{ id:"gitBranch", placeholder:"branch (default main)", className:"rounded-2xl p-2 shadow", disabled } },
        { type:"input", props:{ id:"gitUser", placeholder:"username/token", className:"rounded-2xl p-2 shadow", disabled } },
        { type:"input", props:{ id:"gitPass", placeholder:"password/token", type:"password", className:"rounded-2xl p-2 shadow", disabled } },
        { type:"div", props:{ className:"flex gap-2", children:[
          { type:"button", props:{ className:"rounded-2xl shadow px-2", disabled, onClick:saveGit, children:"Save Git Auth" } },
          { type:"button", props:{ className:"rounded-2xl shadow px-2", disabled, onClick:pull, children:"Pre-pull check & Pull" } }
        ]}}
      ]}},

      { type:"div", props:{ className:"grid gap-2", children:[
        { type:"div", props:{ className:"font-medium", children:"Plugins" }},
        { type:"button", props:{ className:"rounded-2xl shadow px-2", onClick:cleanup, children:"Cleanup Orphans" } }
      ]}}
    ]}}; };
  return { type:"div", props:{ children: page() } };
}