export default async function Entry(){
  const link=(h,l)=>({type:"a",props:{href:"#"+h,className:"px-2 py-1 rounded-2xl shadow",children:l}});
  const route=async()=>{
    const h=(typeof location!=="undefined")?location.hash.replace(/^#/,""):"";
    if(h.startsWith("/apps")) return (await import("./routes/Apps")).default();
    if(h.startsWith("/compliance")) return (await import("./routes/Compliance")).default();
    if(h.startsWith("/logs")) return (await import("./routes/Logs")).default();
    if(h.startsWith("/devices")) return (await import("./routes/Devices")).default();
    if(h.startsWith("/enroll")) return (await import("./routes/Enroll")).default();
    if(h.startsWith("/licenses")) return (await import("./routes/Licenses")).default();
    if(h.startsWith("/settings")) return (await import("./routes/Settings")).default();
    return { type:"div", props:{ className:"p-4 grid gap-2", children:[
      {type:"div",props:{children:"SuperNet Backboard"}} ]}};
  };
  const shell=async()=>({ type:"div", props:{ className:"p-3 grid gap-3", children:[
    { type:"div", props:{ className:"flex gap-2", children:[
      link("/apps","Apps"), link("/devices","Devices"), link("/enroll","Enroll"),
      link("/licenses","Licenses"), link("/logs","Logs"), link("/compliance","Compliance"), link("/settings","Settings")
    ]}},
    await route()
  ]}});
  addEventListener("hashchange",()=>location.reload());
  return shell();
}
