import express from "express";
import bodyParser from "body-parser";
import { AdminDevicesRouter } from "./routes/devices.admin";

const app = express();
app.use(bodyParser.json());

// mount under /api
app.use("/api", AdminDevicesRouter);

// (keep your existing mounts…)
const port = process.env.PORT ? Number(process.env.PORT) : 8080;
app.listen(port, () => console.log(`API listening on :${port}`));
