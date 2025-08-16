const fs = require("fs");
const path = require("path");
function rmrf(p){ if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); }
rmrf("dist");
console.log("[mobile-core] cleaned");