
function log(x){ const el=document.getElementById('log'); el.textContent += (typeof x==='string'? x: JSON.stringify(x,null,2)) + "\n"; el.scrollTop=el.scrollHeight; }
document.getElementById('snHealth').onclick = async ()=> { try{ const r = await window.fabric.invoke('supernet.compile',{ ping:true }, []); log(r); }catch(e){ log(String(e)) } };
document.getElementById('snStart').onclick  = async ()=> { try{ const r = await window.fabric.invoke('agent.start', {}, ['agent.start']); log(r); }catch(e){ log(String(e)) } };
document.getElementById('snPublish').onclick= async ()=> { try{ const p = JSON.parse(document.getElementById('snPub').value||'{}'); const r=await window.fabric.invoke('agent.publish', p, ['agent.publish']); log(r); }catch(e){ log(String(e)) } };
document.getElementById('cmpGo').onclick = async () => { try {
  const inp=document.getElementById('cmpIn').value||''; 
  const out=document.getElementById('cmpOut').value||''; 
  const tgt=document.getElementById('cmpTgt').value||'';
  const r = await window.fabric.invoke('supernet.compile',{ sourcePath: inp, target: tgt }, []);
  await window.fabric.invoke('export.artifact',{ path: out.replace(/^out[\\/]/i,'').replace(/^[\\/]+/,''), content: r }, ['export.artifact']);
  log({ saved: out, result: r });
} catch(e){ log(String(e)) } };


