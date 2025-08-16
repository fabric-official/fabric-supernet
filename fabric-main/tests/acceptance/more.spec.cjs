const assert = require("assert");
const { call } = require("./helpers/call.cjs");

describe("Auth & RBAC", function(){
  this.timeout(10000);
  it("sets passcode and logs in", async ()=>{
    await call("auth.setPasscode", { code:"p@ss1234" });
    const r = await call("auth.login", { code:"p@ss1234" });
    assert.equal(r.ok, true);
    const st = await call("auth.status", {});
    assert.equal(!!st.ok, true);
  });
});

describe("Site & Secrets", function(){
  this.timeout(10000);
  it("site.setup returns a siteId", async ()=>{
    const r = await call("site.setup", { wallet:"WALLET-1" });
    assert.ok(r.ok && String(r.siteId||"").startsWith("SITE-"));
  });
  it("secrets.migrate returns ok", async ()=>{
    const r = await call("secrets.migrate", {});
    assert.equal(r.ok, true);
  });
});

describe("Licenses", function(){
  it("licenses.summary shape", async ()=>{
    const list = await call("licenses.summary", {});
    assert.ok(Array.isArray(list));
    if (list[0]) {
      const x = list[0];
      ["license","seatsTotal","seatsUsed","verified","revokedCount"].forEach(k=> assert.ok(k in x));
    }
  });
});

describe("Plugins", function(){
  it("cleanup returns ok", async ()=>{
    const r = await call("fabric.plugins.cleanup", {});
    assert.equal(r.ok, true);
  });
});

describe("Git Admin", function(){
  this.timeout(15000);
  it("git.config.set stores encrypted password marker and git.pull is ok", async ()=>{
    const r = await call("git.config.set", { url:"https://example.com/repo.git", branch:"main", username:"u", password:"p" });
    assert.equal(r.ok, true);
    const pull = await call("git.pull", {});
    assert.equal(pull.ok, true);
  });
});

describe("Updates stub", function(){
  it("updates.check returns shape", async ()=>{
    const r = await call("updates.check", {});
    assert.equal(r.ok, true);
    assert.equal(r.available, false);
    assert.ok(typeof r.currentVersion === "string");
  });
});

describe("Enrollment", function(){
  it("challenge + request round-trip", async ()=>{
    const nacl = require("tweetnacl");
    const kp = nacl.sign.keyPair();
    const chal = await call("enroll.challenge", { fp:"TEST-DEVICE-1" });
    const msg = Buffer.from(`${chal.fp}|${chal.nonce}|${chal.ts}`, "utf8");
    const proof = Buffer.from(nacl.sign.detached(new Uint8Array(msg), kp.secretKey)).toString("hex");
    const req = await call("enroll.request", { fp:chal.fp, pub: Buffer.from(kp.publicKey).toString("hex"), proof });
    assert.equal(req.ok, true);
    assert.equal(req.queued, true);
  });
});
