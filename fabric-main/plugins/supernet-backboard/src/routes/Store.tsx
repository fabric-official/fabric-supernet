export default function Store({ host }: any){
  async function list(){ const r = await host.runtime.invoke("plugin.store.list"); const ul = document.getElementById("store-list"); if(!ul) return;
    ul.innerHTML = ""; (r.plugins||[]).forEach((p:any)=>{ const li=document.createElement("li"); li.style.margin="8px 0";
      const btn=document.createElement("button"); btn.textContent="Install"; btn.onclick=async()=>{ btn.disabled=true; try{
        const res = await host.runtime.invoke("plugin.store.install",{ id:p.id }); alert("Installed "+res.id);
      } catch(e){ alert(String(e)); } finally{ btn.disabled=false; } };
      li.appendChild(document.createTextNode(`${p.name||p.id} (${p.version||"?"}) - ${p.description||""} `)); li.appendChild(btn); ul.appendChild(li); });
  }
  setTimeout(list, 0);
  return { type:"div", props:{ children:[
    { type:"h3", props:{ children:"Plugin Store" } },
    { type:"ul", props:{ id:"store-list" } }
  ]}};
}
