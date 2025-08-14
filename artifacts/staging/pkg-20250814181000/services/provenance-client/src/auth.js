import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import LRU from "./lru.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const SECRET_PATH = path.join(__dirname, "..", "config", "secret.key");
const CFG_PATH    = path.join(__dirname, "..", "config", "config.json");
const secret = fs.readFileSync(SECRET_PATH);
const cfg    = JSON.parse(fs.readFileSync(CFG_PATH, "utf8"));
const skew   = Number(cfg.clockSkewSec || 90);
const seen   = new LRU(20000);
function sha256(buf){ return crypto.createHash("sha256").update(buf).digest("hex").toUpperCase(); }
function hmacSign(method, p, ts, nonce, bodySha){ const base = `${method}\n${p}\n${ts}\n${nonce}\n${bodySha}`; return crypto.createHmac("sha256", secret).update(base).digest("hex").toUpperCase(); }
export function requireAuth(req,res,next){
  try {
    const ts=req.header("x-ts"); const nonce=req.header("x-nonce"); const sig=req.header("x-sig");
    if(!ts||!nonce||!sig) return res.status(401).json({error:"auth_headers_missing"});
    const now=Math.floor(Date.now()/1000); const tsi=Math.floor(new Date(ts).getTime()/1000);
    if(!tsi || Math.abs(now-tsi)>skew) return res.status(401).json({error:"clock_skew"});
    if(seen.get(nonce)) return res.status(409).json({error:"replay"});
    const bodySha=sha256(req.rawBody ?? Buffer.alloc(0));
    const expect=hmacSign(req.method, req.path, ts, nonce, bodySha);
    if(expect!==sig) return res.status(403).json({error:"bad_sig"});
    seen.set(nonce,true);
    return next();
  } catch(e){ return res.status(500).json({error:"auth_failed"}); }
}
export { sha256 };
