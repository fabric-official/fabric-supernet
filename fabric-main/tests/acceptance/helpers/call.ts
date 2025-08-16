import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export async function call(channel: string, payload: any){
  const bin = path.resolve('dist-electron','main.cjs');
  if (!fs.existsSync(bin)) throw new Error('Build missing: dist-electron/main.cjs');
  const env = { ...process.env, SMOKE_TEST_CALL: channel, SMOKE_TEST_PAYLOAD: JSON.stringify(payload||{}) };
  return await new Promise((resolve,reject)=>{
    const p = spawn(process.execPath, [bin], { env, stdio:['ignore','pipe','pipe']});
    let out=''; let err='';
    p.stdout.on('data',d=> out+=d.toString());
    p.stderr.on('data',d=> err+=d.toString());
    p.on('exit', code=>{
      try {
        if (code===0 && out.trim().startsWith('{')) return resolve(JSON.parse(out));
        if (/SCOPE_DENY|TOOLCHAIN_PIN_FAIL/i.test(err+out)) return reject(new Error(err||out));
        return resolve(out.trim());
      } catch(e){ reject(e); }
    });
  });
}
