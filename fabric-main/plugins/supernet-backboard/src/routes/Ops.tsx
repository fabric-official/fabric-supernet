export default function Ops({ host }: any){ const init=async()=>{ await host.provenance.emit({type:"SetupDelta",siteVersion:1}) }; return { type:"div", props:{ children:"Ops" } } }
