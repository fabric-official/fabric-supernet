const fs = require("fs");
const requireFiles = [
  "src/index.ts",
  "src/pairing.ts",
  "src/approvals.ts",
  "package.json",
  "tsconfig.json"
];
let fail = 0;
for (const f of requireFiles){
  if(!fs.existsSync(f)){ console.error("[check] missing", f); fail++; }
}
if (fail) process.exit(1);
console.log("[check] ok");