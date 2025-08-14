const fs = require("fs");
const { execSync } = require("child_process");
if (!fs.existsSync("dist")) fs.mkdirSync("dist", { recursive: true });
try {
  execSync("npx tsc -p tsconfig.json", { stdio: "inherit" });
  console.log("[mobile-core] build complete");
} catch (e) {
  console.error("[mobile-core] build failed");
  process.exit(1);
}