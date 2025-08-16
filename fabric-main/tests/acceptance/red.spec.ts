import { strict as assert } from 'assert';

describe('Security gates & pins', function(){
  this.timeout(15000);
  it('denies publish when toolchain pin mismatches', async ()=>{
    const call = require('../helpers/call').call;
    const r = await call('agent.publish', { id:'x', toolchainId:'bogus:0.0.0' }).catch((e:any)=>e);
    assert.ok(/TOOLCHAIN_PIN_FAIL|pin/i.test(String(r)), 'expected pin failure');
  });
  it('export.artifact enforces scope', async ()=>{
    const call = require('../helpers/call').call;
    const r = await call('export.artifact', { file:'C:\\Windows\\system32\\evil.bin' }).catch((e:any)=>e);
    assert.ok(String(r).includes('SCOPE_DENY'), 'expected scope deny');
  });
});

describe('Wi-Fi mapping', function(){
  this.timeout(15000);
  it('maps join errors to pretty messages', async ()=>{
    const call = require('../helpers/call').call;
    const r = await call('wifi.join', { ssid:'_invalid_', pass:'x' }).catch((e:any)=>e);
    assert.ok(/Join failed|Invalid|Permission|Timeout|pretty/i.test(String(r)), 'should be mapped');
  });
});

describe('Licenses & Enrollment', function(){
  this.timeout(15000);
  it('licenses.summary shape', async ()=>{
    const call = require('../helpers/call').call;
    const list = await call('licenses.summary', {});
    if (Array.isArray(list) && list[0]) {
      const x = list[0];
      ['license','seatsTotal','seatsUsed','verified','revokedCount'].forEach(k=> { if(!(k in x)) throw new Error('missing '+k); });
    }
  });
  it('device enrollment IPCs exist', async ()=>{
    const call = require('../helpers/call').call;
    const hasChallenge = await call('device.enroll.challenge', {}).then(()=>true).catch(()=>false);
    const hasProof     = await call('device.enroll.proof', {}).then(()=>true).catch(()=>false);
    if (!hasChallenge && !hasProof) throw new Error('enrollment IPCs missing');
  });
});
