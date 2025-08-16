const http = require("http");
const { exec } = require("child_process");

function parseNetsh(stdout){
  const nets = []; let cur = null;
  for(const raw of stdout.split(/\r?\n/)){
    const line = raw.trim(); let m;
    if((m = line.match(/^SSID\s+\d+\s*:\s*(.*)$/i))){ if(cur) nets.push(cur); cur = { ssid:m[1].trim(), bssids:[] }; continue; }
    if((m = line.match(/^BSSID\s+\d+\s*:\s*(.*)$/i))){ cur && cur.bssids.push({ bssid:m[1].trim() }); continue; }
    if((m = line.match(/^Signal\s*:\s*(.*)$/i))){ const last = cur && cur.bssids[cur.bssids.length-1]; (last? last : cur).signal = m[1].trim(); continue; }
    if((m = line.match(/^Channel\s*:\s*(.*)$/i))){ const last = cur && cur.bssids[cur.bssids.length-1]; (last? last : cur).channel = m[1].trim(); continue; }
    if((m = line.match(/^Authentication\s*:\s*(.*)$/i))){ if(cur) cur.auth = m[1].trim(); continue; }
  }
  if(cur) nets.push(cur);
  return nets;
}

const PORT = 47615;
const server = http.createServer((req,res)=>{
  if(req.url === "/wifi/scan"){
    exec("netsh wlan show networks mode=bssid", { windowsHide:true }, (err, stdout) => {
      res.setHeader("content-type","application/json");
      if(err){ res.statusCode=500; return res.end(JSON.stringify({success:false,error:err.message})); }
      try { const networks = parseNetsh(stdout); res.end(JSON.stringify({success:true,networks})); }
      catch(e){ res.statusCode=500; res.end(JSON.stringify({success:false,error:e.message})); }
    });
  } else {
    res.statusCode=404; res.end('{"error":"not found"}');
  }
});
server.listen(PORT, ()=> console.log("wifi-scan listening on http://127.0.0.1:"+PORT+"/wifi/scan"));
