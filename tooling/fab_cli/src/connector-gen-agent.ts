// tooling/fab-cli/src/connector-gen-agent.ts

import * as fs from "fs";
import * as path from "path";
import fetch from "node-fetch";
import inquirer from "inquirer";
import { connect } from "odbc";
import OpenAI from "openai";

interface JDBCSpec {
    type: "jdbc";
    url: string;
    tables: Record<string, string[]>;
}
interface OpenAPISpec {
    type: "openapi";
    url: string;
    spec: any;
}

async function introspectJDBC(connStr: string): Promise<JDBCSpec> {
    const conn = await connect(connStr);
    const tablesRes = await conn.query<{ TABLE_NAME: string }>(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.tables WHERE table_type='BASE TABLE';`
    );
    const tables: Record<string, string[]> = {};
    for (const { TABLE_NAME } of tablesRes) {
        const colsRes = await conn.query<{ COLUMN_NAME: string; DATA_TYPE: string }>(
            `SELECT column_name AS COLUMN_NAME, data_type AS DATA_TYPE
         FROM INFORMATION_SCHEMA.columns
        WHERE table_name='${TABLE_NAME}';`
        );
        tables[TABLE_NAME] = colsRes.map(r => `${r.COLUMN_NAME}:${r.DATA_TYPE}`);
    }
    await conn.close();
    return { type: "jdbc", url: connStr, tables };
}

async function fetchOpenAPI(url: string): Promise<OpenAPISpec> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch OpenAPI spec: ${res.statusText}`);
    const json = await res.json();
    return { type: "openapi", url, spec: json };
}

async function generateFabModule(
    specInfo: JDBCSpec | OpenAPISpec,
    connectorName: string
): Promise<string> {
    const client = new OpenAI({
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
    if (!fab) throw new Error("OpenAI returned no content");
    return fab.trim();
}

async function run() {
    const answers = await inquirer.prompt<{
        specSource: string;
        connectorName: string;
        specType: "OpenAPI" | "JDBC";
    }>([
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
            validate: v =>
                /^[A-Z][A-Za-z0-9]+$/.test(v) || "Must be PascalCase",
        },
        {
            type: "list",
            name: "specType",
            message: "Spec type:",
            choices: ["OpenAPI", "JDBC"],
        },
    ]);

    let specInfo: JDBCSpec | OpenAPISpec;
    if (answers.specType === "OpenAPI") {
        console.log(`⏳ Fetching OpenAPI from ${answers.specSource}…`);
        specInfo = await fetchOpenAPI(answers.specSource);
    } else {
        console.log(`⏳ Introspecting JDBC at ${answers.specSource}…`);
        specInfo = await introspectJDBC(answers.specSource);
    }

    console.log("🤖 Generating .fab module via OpenAI…");
    const fab = await generateFabModule(specInfo, answers.connectorName);

    const modulesDir = path.resolve(
        process.cwd(),
        "apps",
        answers.connectorName.toLowerCase(),
        "modules"
    );
    fs.mkdirSync(modulesDir, { recursive: true });
    const outPath = path.join(
        modulesDir,
        `${answers.connectorName}Connector.fab`
    );
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

