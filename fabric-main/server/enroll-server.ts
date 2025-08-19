import express from "express";
import { enrollChallenge, enrollProof } from "../electron/ipc/bridge";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/version", (_req, res) => res.json({ version: process.env.APP_VERSION ?? "dev" }));

app.get("/api/enroll/challenge", async (_req, res, next) => {
  try {
    const ch = await enrollChallenge(); // { nonce, payload, expiresAt, ... }
    res.status(200).json(ch);
  } catch (e) { next(e); }
});

app.post("/api/enroll/proof", async (req, res, next) => {
  try {
    const { nonce, proof, device } = req.body ?? {};
    if (!nonce || !proof) return res.status(400).json({ error: "nonce and proof required" });
    const result = await enrollProof({ nonce, proof, device }); // e.g., { deviceId, token }
    res.status(200).json(result);
  } catch (e) { next(e); }
});

app.use((err: any, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: String(err?.message ?? err) });
});

const port = Number(process.env.ENROLL_PORT ?? 8787);
const host = process.env.ENROLL_HOST ?? "127.0.0.1";
app.listen(port, host, () => console.log(`Enroll API on http://${host}:${port}`));
