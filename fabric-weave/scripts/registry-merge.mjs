import fs from "fs";
import path from "path";

const ROOT = path.resolve(process.cwd());
const CONFIG_TS = path.join(ROOT, "plugin.config.ts");

export function toCamel(id) {
  return id.split("-").map((p,i)=> i===0 ? p : (p[0]?.toUpperCase()||"")+p.slice(1)).join("");
}
function read(p){ return fs.existsSync(p) ? fs.readFileSync(p,"utf8") : ""; }
function write(p,s){ fs.writeFileSync(p,s,{encoding:"utf8"}); }

export function mergePlugin(id){
  const alias = toCamel(id)+"Plugin";
  const importLine = `import ${alias} from "./src/plugins/${id}/src/index";`;

  let txt = read(CONFIG_TS);
  if (!txt) throw new Error("plugin.config.ts missing");

  // Ensure markers exist (create minimal if missing, preserve imports)
  if (!/AUTO-PLUGINS START/.test(txt) || !/AUTO-PLUGINS END/.test(txt)) {
    const imports = (txt.match(/^\s*import\s+.*$/gm) || []).join("\n");
    let rest = txt.replace(/^\s*import\s+.*$/gm,"").trim();
    if (!/export\s+const\s+plugins\s*=/.test(rest)) {
      rest = `
// --- AUTO-PLUGINS START (managed by installer; do not edit inside) ---
export const AUTO_PLUGINS = [
];
// --- AUTO-PLUGINS END ---

export const plugins = [
  ...AUTO_PLUGINS,
] as unknown as import("@/types/plugin").DashboardPlugin[];

export default plugins;
`.trimStart();
    }
    txt = (imports ? imports + "\n\n" : "") + rest;
  }

  // Ensure single import for this id
  const impRe = new RegExp(String.raw`^\s*import\s+[A-Za-z0-9_$]+\s+from\s+"\.\/src\/plugins\/${id}\/src\/index";?\s*$`, "m");
  if (!impRe.test(txt)) {
    if (/^import\s/m.test(txt)) txt = txt.replace(/^import\s/m, importLine + "\nimport ");
    else txt = importLine + "\n" + txt;
  }

  // Inject alias only inside AUTO_PLUGINS
  const blockRe = /\/\/\s*---\s*AUTO-PLUGINS START[\s\S]*?export\s+const\s+AUTO_PLUGINS\s*=\s*\[([\s\S]*?)\];[\s\S]*?AUTO-PLUGINS END/;
  const m = txt.match(blockRe);
  if (!m) throw new Error("AUTO_PLUGINS block missing");
  const inside = m[1];
  const list = inside.split(",").map(s=>s.trim()).filter(Boolean);
  if (!list.includes(alias)) list.push(alias);
  const joined = list.length ? "  " + list.join(",\n  ") + "\n" : "";
  txt = txt.replace(blockRe, (full) => full.replace(inside, joined));

  write(CONFIG_TS, txt);
  return { id, alias };
}
