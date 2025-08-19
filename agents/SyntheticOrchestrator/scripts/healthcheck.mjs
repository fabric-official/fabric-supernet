import { readFileSync } from "node:fs";
try {
  const s = JSON.parse(readFileSync("artifacts/status.json","utf-8"));
  console.log(JSON.stringify({ ok:true, started_at: s.started_at, finished_at: s.finished_at, current: s.current, ok_flag: s.ok }));
} catch(e){
  console.log(JSON.stringify({ ok:false, err:String(e) }));
}
