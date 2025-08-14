#!/usr/bin/env node
/* no-BOM */
const fs=require("fs"); const path=require("path");
const grpc=require("@grpc/grpc-js"); const protoLoader=require("@grpc/proto-loader");
function arg(f,b=null){ const i=process.argv.indexOf(f); return i>=0&&process.argv[i+1]?process.argv[i+1]:b; }
const url=process.env.FAB_REMOTE || arg("--url","127.0.0.1:8891");
const inFile=arg("--in"); const outIR=arg("--out","out/hello.remote.ir.json");
const target=arg("--target","sol"); const auth=process.env.FAB_AUTH || arg("--auth","");
if(!inFile){ console.error("Missing --in"); process.exit(2); }
const pkgDef=protoLoader.loadSync(path.join(__dirname,"..","proto","fabric","core","language","v1","language.proto"),
  {keepCase:true,longs:String,enums:String,defaults:true,oneofs:true});
const proto=grpc.loadPackageDefinition(pkgDef).fabric.core.language.v1;
const client=new proto.LanguageBrain(url, grpc.credentials.createInsecure());
const req={ src:[{path:path.basename(inFile),content:fs.readFileSync(inFile,"utf8"),lang:"en"}],
            flags:{targets:[target],reproducible:true}, auth_token:auth };
client.Compile(req,(err,resp)=>{
  if(err){ console.error(String(err)); process.exit(1); }
  if(resp.ir_json?.length){ fs.mkdirSync(path.dirname(outIR),{recursive:true}); fs.writeFileSync(outIR,Buffer.from(resp.ir_json)); console.log("IR:",outIR); }
  if(resp.artifacts?.length){ for(const a of resp.artifacts){ const p=path.join(process.cwd(),a.path); fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,Buffer.from(a.bytes)); console.log("Artifact:",a.path); } }
  if(resp.attestation?.json){ console.log("Attestation:", resp.attestation.json); }
  process.exit(0);
});