import fs from "node:fs";

const reg = JSON.parse(fs.readFileSync("registry/index.json","utf8"));
const disk = fs.existsSync("plugins")
  ? fs.readdirSync("plugins", { withFileTypes:true }).filter(d=>d.isDirectory()).map(d=>d.name)
  : [];

const listed = new Set((reg.plugins||[]).map(p => p.id));
const exists = new Set(disk);
const demos = new Set(["fabric.hello-world"]); // demos allowed on disk, not required in registry

const missingOnDisk = [...listed].filter(id => !exists.has(id));
const unlisted = [...exists].filter(id => !listed.has(id) && !demos.has(id));

if (missingOnDisk.length) {
  console.error("❌ registry lists plugins not on disk:", missingOnDisk);
  process.exit(1);
}
if (unlisted.length) {
  console.error("❌ plugins present on disk but not in registry:", unlisted);
  process.exit(1);
}
console.log("✅ registry ↔ disk parity OK");
