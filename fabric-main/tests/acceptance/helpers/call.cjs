const { spawn } = require("child_process");
const path = require("path");
const fs = require('fs');
const electron = require('electron');

async function call(channel, payload){
  const bin = path.resolve("dist-electron","main.cjs");
  if (!fs.existsSync(bin)) throw new Error("Build missing: dist-electron/main.cjs");
  const env = { ...process.env, SMOKE_TEST_CALL: channel, SMOKE_TEST_PAYLOAD: JSON.stringify(payload||{}) };
  return await new Promise((resolve,reject)=>{
    const p = spawn(electron, [bin], { env, stdio:["ignore","pipe","pipe"]});
    let out="", err="";
    p.stdout.on("data",d=> out+=d.toString());
    p.stderr.on("data",d=> err+=d.toString());
    p.on("exit", code=>{
      const text = (out || "").trim();
      try {
        if (code === 0) {
          // Accept object OR array JSON
          return resolve(JSON.parse(text));
        }
      } catch (_) {
        // fall through
      }
      if (code === 0) return resolve(text);
      return reject(new Error((err || text || ("exit "+code)).trim()));
    });
  });
}
module.exports = { call };
