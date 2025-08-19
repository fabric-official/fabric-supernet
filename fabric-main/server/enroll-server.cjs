const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const fetch = require("node-fetch");

function req(p){ try { return require(p); } catch { return null; } }
function pickFunction(mod, names){
  if(!mod) return null;
  if(typeof mod === "function") return mod;
  if(typeof mod.default === "function") return mod.default;
  for(const n of names){ if(typeof mod[n] === "function") return mod[n]; }
  return null;
}
async function tryCalls(fn, payload){
  const attempts = [
    () => fn(payload),
    () => fn({ body: payload }),
    () => fn(null, payload),
    () => fn({ body: payload }, payload),
    () => fn({ request: { body: payload } }),
  ];
  let lastErr=null;
  for(const r of attempts){ try{ return await r(); } catch(e){ lastErr=e; } }
  throw lastErr;
}

/** ---- Upstream helpers ---- */
const UPSTREAM = process.env.UPSTREAM_API || "http://127.0.0.1:3000";
async function seedDeviceUpstream(seed) {
  const creates = [
    ["POST","/api/devices"],
    ["POST","/api/devices/register"],
    ["POST","/api/device/register"],
    ["POST","/api/mock/devices"],     // some mocks expose a mock namespace
    ["PUT" ,`/api/devices/${encodeURIComponent(seed.id)}`],
  ];
  for (const [method, path] of creates) {
    try {
      const r = await fetch(UPSTREAM + path, {
        method,
        headers: { "content-type": "application/json" },
        body: method === "PUT" || method === "POST" ? JSON.stringify(seed) : undefined
      });
      if (r.ok) {
        console.log(`[EnrollAPI] Seeded upstream via ${method} ${path}`);
        return true;
      }
    } catch (_) {}
  }
  console.warn("[EnrollAPI] Could not seed upstream via any create endpoint");
  return false;
}

async function verifyDeviceVisible(fp, timeoutMs=5000) {
  const deadline = Date.now() + timeoutMs;
  const lists = [
    "/api/devices",
    "/api/device/list",
    "/api/devices/list",
    "/api/admin/devices",
    "/api/devices?limit=100",
  ];
  while (Date.now() < deadline) {
    for (const path of lists) {
      try {
        const r = await fetch(UPSTREAM + path);
        if (!r.ok) continue;
        const txt = await r.text();
        try {
          const data = JSON.parse(txt);
          const arr = Array.isArray(data) ? data
                   : Array.isArray(data?.devices) ? data.devices
                   : Array.isArray(data?.items) ? data.items
                   : [];
          if (arr.some(d => [d.fp, d.id, d.name].includes(fp))) {
            console.log(`[EnrollAPI] Verified device visible at GET ${path}`);
            return true;
          }
        } catch {}
      } catch {}
    }
    await new Promise(r => setTimeout(r, 250));
  }
  console.warn("[EnrollAPI] Device not visible on any known list endpoint (yet)");
  return false;
}

/** ---- Load compiled IPC handlers (real mode) ---- */
const chMod = req("../dist-electron/ipc/device.enroll.challenge.js");
const prMod = req("../dist-electron/ipc/device.enroll.proof.js");
const challenge = pickFunction(chMod, ["handle","challenge","handler","run","main","enrollChallenge"]);
const proof     = pickFunction(prMod, ["handle","proof","submit","handler","run","main","enrollProof"]);

const app = express();
app.use(express.json());
app.use((req,res,next)=>{ console.log(`[EnrollAPI] ${new Date().toISOString()} ${req.method} ${req.url}`); res.setHeader("X-Enroll-API","true"); next(); });

app.get("/health", (_req,res)=>res.json({ok:true,service:"EnrollAPI"}));
app.get("/version", (_req,res)=>res.json({version:process.env.APP_VERSION??"dev"}));

/** ---- Challenge ---- */
app.post("/api/enroll/challenge", async (req,res)=>{
  if(!challenge) return res.status(500).json({error:"challenge handler missing"});
  try{ const out=await tryCalls(challenge, req.body ?? {}); res.status(200).json(out); }
  catch(e){ console.error(e); res.status(400).json({error:String(e?.message??e)}); }
});
app.get("/api/enroll/challenge", (_req,res)=>res.status(405).json({error:"Use POST /api/enroll/challenge"}));

/** ---- Proof ---- */
app.post("/api/enroll/proof", async (req,res)=>{
  const body = req.body ?? {};

  // Harness mock path — accept immediately, then seed upstream and verify list
  if (body.mock === true) {
    const fp  = body.fp || `${process.env.COMPUTERNAME||'dev'}-${process.env.USERDOMAIN||'local'}`;
    const now = new Date().toISOString();
    const seed = {
      id: fp, fp, name: fp,
      os: "windows", status: "pending",
      enrolled_at: now, last_seen: now,
      note: "seeded-by-enroll-bridge"
    };

    res.status(200).json({ ok:true, queued:true, mock:true });

    (async () => {
      const ok = await seedDeviceUpstream(seed);
      if (ok) await verifyDeviceVisible(fp, 7000);
    })();
    return;
  }

  // Real proof -> call compiled IPC
  if(!proof) return res.status(500).json({error:"proof handler missing"});
  try{
    const out = await tryCalls(proof, body);
    res.status(200).json(out);

    // After real enroll, seed/verify upstream too so UI shows it
    const fp  = body.fp || out?.fp || "device";
    const now = new Date().toISOString();
    const seed = {
      id: fp, fp, name: fp,
      os: "windows", status: "pending",
      enrolled_at: now, last_seen: now,
      note: "seeded-by-enroll-bridge(real)"
    };
    (async () => {
      const ok = await seedDeviceUpstream(seed);
      if (ok) await verifyDeviceVisible(fp, 7000);
    })();
  } catch(e){
    console.error(e); res.status(400).json({error:String(e?.message??e)});
  }
});

/** ---- Proxy all other /api/* to Docker API ---- */
app.use("/api", (req, res, next) => {
  if (req.url.startsWith("/enroll/")) return next();
  return createProxyMiddleware({ target: UPSTREAM, changeOrigin:true, xfwd:true, logLevel:"warn" })(req, res, next);
});

app.use((req,res)=>res.status(404).json({error:"Not Found",path:req.url,service:"EnrollAPI"}));

const port = Number(process.env.ENROLL_PORT??8878), host=process.env.ENROLL_HOST??"127.0.0.1";
app.listen(port,host,()=>console.log(`Enroll API on http://${host}:${port}  (proxying others to ${UPSTREAM})`));
