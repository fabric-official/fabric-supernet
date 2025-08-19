const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
app.disable("x-powered-by");
app.get("/", (req,res)=> res.json({ status:"ok", service:"si-core-service" }));
app.get("/healthz", (req,res)=> res.status(200).send("healthy"));
const server = app.listen(PORT, ()=> console.log(`si-core-service listening on ${PORT}`));
process.on("SIGINT", ()=> server.close(()=>process.exit(0)));
process.on("SIGTERM",()=> server.close(()=>process.exit(0)));
