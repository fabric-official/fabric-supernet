import fs from "node:fs";
import path from "node:path";

const suspects = [];
function scan(p) {
  const st = fs.statSync(p);
  if (st.isDirectory()) {
    for (const x of fs.readdirSync(p)) scan(path.join(p,x));
  } else {
    if (p.endsWith(".sig") && st.size < 64) suspects.push(p);
    if (/\.(json|js|mjs|ts|tsx)$/.test(p)) {
      const s = fs.readFileSync(p, "utf8");
      const hits = ["TBD","TODO","<replace>","example.com","BASE64_PUBKEY","YOUR_KEY_HERE","DUMMY","PLACEHOLDER"]
        .filter(t => s.includes(t));
      if (hits.length) suspects.push(`${p} (contains ${hits.join(", ")})`);
    }
  }
}
// IMPORTANT: do NOT scan "scripts" to avoid self-flagging
["plugins","registry","schemas"].forEach(d => { if (fs.existsSync(d)) scan(d); });

if (suspects.length) {
  console.error("❌ placeholders detected:\n" + suspects.map(s=>" - "+s).join("\n"));
  process.exit(1);
}
console.log("✅ no placeholders");

