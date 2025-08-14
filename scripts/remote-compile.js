#!/usr/bin/env node
/* no-BOM */
const fs = require("fs");
const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

function arg(flag, fallback=null) {
  const i = process.argv.indexOf(flag);
  return i>=0 && process.argv[i+1] ? process.argv[i+1] : fallback;
}

const url    = arg("--url","127.0.0.1:8891");
const inFile = arg("--in");
const outIR  = arg("--out","out/hello.remote.ir.json");
const target = arg("--target","sol");
const auth   = arg("--auth","");

if (!inFile) { console.error("Missing --in"); process.exit(2); }

const pkgDef = protoLoader.loadSync(
  path.join(__dirname, "..", "proto", "fabric", "core", "language", "v1", "language.proto"),
  { keepCase:true, longs:String, enums:String, defaults:true, oneofs:true }
);
const proto = grpc.loadPackageDefinition(pkgDef).fabric.core.language.v1;

const creds = grpc.credentials.createInsecure();
const client = new proto.LanguageBrain(url, creds);

const content = fs.readFileSync(inFile, "utf8");

const req = {
  src: [{ path: path.basename(inFile), content, lang: "en" }],
  flags: { targets: [target], reproducible: true },
  auth_token: auth
};

client.Compile(req, (err, resp) => {
  if (err) { console.error(String(err)); process.exit(1); }
  if (resp.ir_json && resp.ir_json.length) {
    fs.mkdirSync(path.dirname(outIR), { recursive: true });
    fs.writeFileSync(outIR, Buffer.from(resp.ir_json));
    console.log("IR written:", outIR);
  }
  if (resp.artifacts && resp.artifacts.length) {
    for (const a of resp.artifacts) {
      const p = path.join(process.cwd(), a.path);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, Buffer.from(a.bytes));
      console.log("Artifact:", a.path);
    }
  }
  if (resp.attestation && resp.attestation.json) {
    console.log("Attestation:", resp.attestation.json);
  }
  process.exit(0);
});