"use strict";
// tooling/fab-cli/src/connector-gen-agent.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const inquirer_1 = __importDefault(require("inquirer"));
const odbc_1 = require("odbc");
const openai_1 = __importDefault(require("openai"));
async function introspectJDBC(connStr) {
    const conn = await (0, odbc_1.connect)(connStr);
    const tablesRes = await conn.query(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.tables WHERE table_type='BASE TABLE';`);
    const tables = {};
    for (const { TABLE_NAME } of tablesRes) {
        const colsRes = await conn.query(`SELECT column_name AS COLUMN_NAME, data_type AS DATA_TYPE
         FROM INFORMATION_SCHEMA.columns
        WHERE table_name='${TABLE_NAME}';`);
        tables[TABLE_NAME] = colsRes.map(r => `${r.COLUMN_NAME}:${r.DATA_TYPE}`);
    }
    await conn.close();
    return { type: "jdbc", url: connStr, tables };
}
async function fetchOpenAPI(url) {
    const res = await (0, node_fetch_1.default)(url);
    if (!res.ok)
        throw new Error(`Failed to fetch OpenAPI spec: ${res.statusText}`);
    const json = await res.json();
    return { type: "openapi", url, spec: json };
}
async function generateFabModule(specInfo, connectorName) {
    const client = new openai_1.default({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const prompt = `
You are a code generator for Fabric DSL (.fab). Given this ${specInfo.type} spec metadata, generate a complete Fabric module named ${connectorName}Connector with:

1. A device block named ${connectorName} that lists its endpoint URI and capability types.
2. An agent block named ${connectorName}Parser that uses a generic "spec-parser" model to ingest from the device and output a typed record.
3. Default fallback preserving state and a minimal policy block (privacy anonymized).

Spec metadata:
${JSON.stringify(specInfo, null, 2)}

Output only valid .fab code.
`;
    const resp = await client.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "system", content: prompt }],
        temperature: 0.2,
        max_tokens: 800,
    });
    const fab = resp.choices?.[0]?.message?.content;
    if (!fab)
        throw new Error("OpenAI returned no content");
    return fab.trim();
}
async function run() {
    const answers = await inquirer_1.default.prompt([
        {
            type: "input",
            name: "specSource",
            message: "OpenAPI URL or JDBC connection string:",
            validate: v => !!v || "Required",
        },
        {
            type: "input",
            name: "connectorName",
            message: "Connector name (PascalCase):",
            validate: v => /^[A-Z][A-Za-z0-9]+$/.test(v) || "Must be PascalCase",
        },
        {
            type: "list",
            name: "specType",
            message: "Spec type:",
            choices: ["OpenAPI", "JDBC"],
        },
    ]);
    let specInfo;
    if (answers.specType === "OpenAPI") {
        console.log(`⏳ Fetching OpenAPI from ${answers.specSource}…`);
        specInfo = await fetchOpenAPI(answers.specSource);
    }
    else {
        console.log(`⏳ Introspecting JDBC at ${answers.specSource}…`);
        specInfo = await introspectJDBC(answers.specSource);
    }
    console.log("🤖 Generating .fab module via OpenAI…");
    const fab = await generateFabModule(specInfo, answers.connectorName);
    const modulesDir = path.resolve(process.cwd(), "apps", answers.connectorName.toLowerCase(), "modules");
    fs.mkdirSync(modulesDir, { recursive: true });
    const outPath = path.join(modulesDir, `${answers.connectorName}Connector.fab`);
    fs.writeFileSync(outPath, fab, "utf8");
    console.log(`✅ Generated Fabric module at ${outPath}`);
    console.log("You can now run:");
    console.log(`    fab build ${outPath}`);
    console.log(`    fab deploy --local`);
}
if (require.main === module) {
    run().catch(err => {
        console.error("Error:", err.message || err);
        process.exit(1);
    });
}
//# sourceMappingURL=connector-gen-agent.js.map