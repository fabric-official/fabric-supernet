import { Router } from "express";
import fs from "node:fs";
import path from "node:path";

const DEVICES_PATH = path.resolve(process.cwd(), "data/devices.json");
function load(): any[] {
  try { return JSON.parse(fs.readFileSync(DEVICES_PATH, "utf8")); }
  catch { return []; }
}
function save(list: any[]) {
  fs.mkdirSync(path.dirname(DEVICES_PATH), { recursive: true });
  fs.writeFileSync(DEVICES_PATH, JSON.stringify(list, null, 2));
}

export const AdminDevicesRouter = Router();

/** GET /api/devices — lists devices (array) */
AdminDevicesRouter.get("/devices", (req, res) => {
  res.json(load());
});

/** POST /api/admin/devices — upsert a device */
AdminDevicesRouter.post("/admin/devices", (req, res) => {
  const body = req.body || {};
  const id = String(body.id || body.fp || body.name || "").trim();
  if (!id) return res.status(400).json({ error: "id/fp/name required" });

  const now = new Date().toISOString();
  const list = load();
  const idx = list.findIndex(d => d.id === id || d.fp === id || d.name === id);

  const device = {
    id,
    fp: body.fp ?? id,
    name: body.name ?? id,
    os: body.os ?? "unknown",
    status: body.status ?? "enrolled",
    enrolled_at: body.enrolled_at ?? now,
    last_seen: now,
    note: body.note ?? "seeded",
    ...body,
  };

  if (idx >= 0) list[idx] = { ...list[idx], ...device };
  else list.push(device);

  save(list);
  return res.status(201).json(device);
});

/** PUT /api/admin/devices/:id — upsert by id path */
AdminDevicesRouter.put("/admin/devices/:id", (req, res) => {
  req.body = { ...(req.body || {}), id: req.params.id };
  return (AdminDevicesRouter as any).handle({ ...req, method: "POST", url: "/admin/devices" }, res);
});
