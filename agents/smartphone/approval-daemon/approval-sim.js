/* Smartphone approval broker simulator: listens on localhost:7357 */
const http = require("http");
const { readFileSync } = require("fs");
const schema = JSON.parse(readFileSync("./agents/smartphone/approval-daemon/approval.schema.json", "utf8"));

function ok(res, body){ res.writeHead(200, {"Content-Type":"application/json"}); res.end(JSON.stringify(body)); }
function bad(res, msg){  res.writeHead(400, {"Content-Type":"application/json"}); res.end(JSON.stringify({error:msg})); }

function validate(o){
  if(typeof o!=="object") return "bad body";
  if(!o.deviceId || !o.wallet || !o.request) return "missing fields";
  if(!["EXECUTE","BUDGET","PAIR","UNPAIR"].includes(o.request.type)) return "bad request.type";
  if(!o.request.target) return "missing request.target";
  return null;
}

http.createServer((req,res)=>{
  if(req.method!=="POST"){ bad(res,"use POST"); return; }
  let buf = "";
  req.on("data", c=> buf+=c);
  req.on("end", ()=>{
    try{
      const data = JSON.parse(buf);
      const err  = validate(data);
      if(err){ bad(res,err); return; }
      // simple policy: approve EXECUTE if <= 50Wh and not expired
      if(data.request.type==="EXECUTE"){
        const energy = Number(data.request.energyWh||0);
        if(energy>50){ ok(res,{decision:"DENY",reason:"energy"}); return; }
        if(data.request.expiresAt && Date.parse(data.request.expiresAt)<Date.now()){
          ok(res,{decision:"DENY",reason:"expired"}); return;
        }
        ok(res,{decision:"APPROVE"});
      } else if(data.request.type==="PAIR"){ ok(res,{decision:"APPROVE"}); }
      else { ok(res,{decision:"ACK"}); }
    } catch(e){ bad(res,"parse error"); }
  });
}).listen(7357, "127.0.0.1", ()=> console.log("[smartphone-approval] listening on 127.0.0.1:7357"));
