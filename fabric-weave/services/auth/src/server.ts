import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import bcrypt from "bcryptjs";
import * as fs from "node:fs";
import * as path from "node:path";
import type { FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.PORT || 8787);
const JWT_SECRET = process.env.JWT_SECRET || "change_me";
const DB_FILE = path.resolve("./auth.users.json");

type User = { id: string; email: string; passwordHash: string; createdAt: string };
type Db = { users: User[] };

function loadDb(): Db {
  try {
    if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ users: [] }, null, 2));
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch (e) {
    console.error("DB read error", e);
    return { users: [] };
  }
}
function saveDb(db: Db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

async function buildServer() {
  const app = Fastify({ logger: true });

  app.setErrorHandler((err, _req, reply) => {
    app.log.error(err, "unhandled error");
    reply.code(500).send({ message: "internal error" });
  });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(jwt as any, { secret: JWT_SECRET });

  app.get("/api/health", async (_req, reply) => reply.code(200).send({ ok: true, service: "auth" }));

  app.decorate("authenticate", async (req: FastifyRequest, reply: FastifyReply) => {
    try { await (req as any).jwtVerify(); }
    catch { return reply.code(401).send({ message: "unauthorized" }); }
  });

  app.post("/api/auth/register", async (req, reply) => {
    try {
      const body = (req.body as any) || {};
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      if (!email || !password || password.length < 8) {
        return reply.code(400).send({ message: "email and password (>=8) required" });
      }
      const db = loadDb();
      if (db.users.some(u => u.email === email)) {
        return reply.code(409).send({ message: "email already registered" });
      }
      const passwordHash = bcrypt.hashSync(password, 10);
      const user: User = { id: randomUUID(), email, passwordHash, createdAt: new Date().toISOString() };
      db.users.push(user);
      saveDb(db);
      const token = (app as any).jwt.sign({ sub: user.id, email: user.email });
      return reply.code(201).send({ id: user.id, email: user.email, token });
    } catch (e) {
      (req as any).log?.error(e, "register failed");
      return reply.code(500).send({ message: "internal error" });
    }
  });

  app.post("/api/auth/login", async (req, reply) => {
    try {
      const body = (req.body as any) || {};
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const db = loadDb();
      const user = db.users.find(u => u.email === email);
      if (!user) return reply.code(401).send({ message: "invalid credentials" });
      const ok = bcrypt.compareSync(password, user.passwordHash);
      if (!ok) return reply.code(401).send({ message: "invalid credentials" });
      const token = (app as any).jwt.sign({ sub: user.id, email: user.email });
      return reply.send({ id: user.id, email: user.email, token });
    } catch (e) {
      (req as any).log?.error(e, "login failed");
      return reply.code(500).send({ message: "internal error" });
    }
  });

  app.get("/api/auth/me", { preHandler: [ (app as any).authenticate ] }, async (req: any, reply) => {
    return reply.send({
      id: req.user?.sub,
      email: req.user?.email,
      role: "admin",
      permissions: ["devices.view","wifi.view","treasury.view"]
    });
  });

  return app;
}

(async () => {
  const app = await buildServer();
  app.listen({ host: "0.0.0.0", port: PORT })
    .then(() => console.log(`[auth] listening on ${PORT}`))
    .catch((err) => { console.error(err); process.exit(1); });
})();
