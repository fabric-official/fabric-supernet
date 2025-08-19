import fs from "node:fs";
const reg = JSON.parse(fs.readFileSync("registry/index.json","utf8"));
if ((reg.plugins||[]).some(p => p.id === "fabric.hello-world")) {
  console.error("❌ registry lists demo plugin fabric.hello-world");
  process.exit(1);
}
console.log("✅ no demo plugins in registry");
