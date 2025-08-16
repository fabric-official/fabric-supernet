import { Command } from "commander";
import fs from "fs";

// Configurable path to the ledger file (used for local inspection)
const LEDGER_PATH = process.env.FAB_LEDGER_PATH || "ledger/audit.log";

// Strongly typed ledger event interface
interface EnergyDelta {
    type: string;
    atom_id: string;
    amount: number;
    [key: string]: any;
}

// Helper to parse ledger entries
function readLedger(): EnergyDelta[] {
    if (!fs.existsSync(LEDGER_PATH)) {
        console.error(`Ledger not found at ${LEDGER_PATH}`);
        process.exit(1);
    }

    const lines = fs.readFileSync(LEDGER_PATH, "utf-8")
        .split("\n")
        .filter(Boolean);

    return lines.map((line) => {
        try {
            return JSON.parse(line) as EnergyDelta;
        } catch {
            return null;
        }
    }).filter((entry): entry is EnergyDelta => entry !== null);
}

export const energyCommand = new Command("energy")
    .description("Manage energy balance for Fabric agents");

energyCommand
    .command("status")
    .requiredOption("--agent <id>", "Agent ID")
    .description("Check energy draw status for a specific agent")
    .action((opts: { agent: string }) => {
        const ledger = readLedger();
        let totalUsed = 0;
        for (const entry of ledger) {
            if (entry.atom_id === opts.agent && entry.type === "EnergyDrawDelta") {
                totalUsed += entry.amount;
            }
        }
        console.log(`⚡ Agent ${opts.agent} has used ${totalUsed} eV`);
    });

energyCommand
    .command("recharge")
    .requiredOption("--agent <id>", "Agent ID")
    .requiredOption("--amount <value>", "Amount of energy to recharge (eV)")
    .description("Recharge energy for an agent")
    .action((opts: { agent: string; amount: string }) => {
        const delta: EnergyDelta = {
            type: "EnergyRechargeDelta",
            timestamp: new Date().toISOString(),
            atom_id: opts.agent,
            amount: parseInt(opts.amount),
            source: "cli-recharge"
        };

        fs.appendFileSync(LEDGER_PATH, JSON.stringify(delta) + "\n");
        console.log(`🔋 Recharged ${opts.amount} eV to agent ${opts.agent}`);
    });

