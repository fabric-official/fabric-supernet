import * as fs from "fs"; import * as path from "path"; import { scopeFile } from "./fabricsec";
export function exportArtifact(source:string, destRel:string){
  const destAbs = scopeFile(path.join("out", destRel || path.basename(source)));
  fs.mkdirSync(require("path").dirname(destAbs),{recursive:true});
  fs.copyFileSync(source, destAbs);
  return { ok:true, path: destAbs };
}