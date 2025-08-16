"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.energyCommand = void 0;
const commander_1 = require("commander");
const fs_1 = __importDefault(require("fs"));
// Configurable path to the ledger file (used for local inspection)
const LEDGER_PATH = process.env.FAB_LEDGER_PATH || "ledger/audit.log";
// Helper to parse ledger entries
function readLedger() {
    if (!fs_1.default.existsSync(LEDGER_PATH)) {
        console.error(`Ledger not found at ${LEDGER_PATH}`);
        process.exit(1);
    }
    const lines = fs_1.default.readFileSync(LEDGER_PATH, "utf-8")
        .split("\n")
        .filter(Boolean);
    return lines.map((line) => {
        try {
            return JSON.parse(line);
        }
        catch {
            return null;
        }
    }).filter((entry) => entry !== null);
}
exports.energyCommand = new commander_1.Command("energy")
    .description("Manage energy balance for Fabric agents");
exports.energyCommand
    .command("status")
    .requiredOption("--agent <id>", "Agent ID")
    .description("Check energy draw status for a specific agent")
    .action((opts) => {
    const ledger = readLedger();
    let totalUsed = 0;
    for (const entry of ledger) {
        if (entry.atom_id === opts.agent && entry.type === "EnergyDrawDelta") {
            totalUsed += entry.amount;
        }
    }
    console.log(`⚡ Agent ${opts.agent} has used ${totalUsed} eV`);
});
exports.energyCommand
    .command("recharge")
    .requiredOption("--agent <id>", "Agent ID")
    .requiredOption("--amount <value>", "Amount of energy to recharge (eV)")
    .description("Recharge energy for an agent")
    .action((opts) => {
    const delta = {
        type: "EnergyRechargeDelta",
        timestamp: new Date().toISOString(),
        atom_id: opts.agent,
        amount: parseInt(opts.amount),
        source: "cli-recharge"
    };
    fs_1.default.appendFileSync(LEDGER_PATH, JSON.stringify(delta) + "\n");
    console.log(`🔋 Recharged ${opts.amount} eV to agent ${opts.agent}`);
});
//# sourceMappingURL=energy.js.map