// tooling/fab-cli/src/commands/rollback.ts

import { Command } from "commander";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import chalk from "chalk";

const PROTO_PATH = path.resolve(__dirname, "../../proto/audit.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const auditProto: any = grpc.loadPackageDefinition(packageDefinition).fab;

export const rollbackCommand = new Command("rollback")
    .description("Rewind the atom to the last valid state")
    .requiredOption("--atom <id>", "Atom ID to rollback")
    .action(async (options: { atom: string }) => {
        const client = new auditProto.AuditService(
            "localhost:50052",
            grpc.credentials.createInsecure()
        );

        const request = { atom_id: options.atom };

        client.RollbackAtom(request, (err: any, response: any) => {
            if (err) {
                console.error(chalk.red(`❌ Rollback failed: ${err.message}`));
                process.exit(1);
            }

            if (response.status !== "OK") {
                console.error(
                    chalk.red(`❌ Rollback denied: ${response.reason || "Unknown reason"}`)
                );
                process.exit(1);
            }

            console.log(chalk.green("✅ Rollback successful"));
            console.log(chalk.gray(`Before:  ${response.previous_hash}`));
            console.log(chalk.gray(`After:   ${response.current_hash}`));
            console.log(
                chalk.gray(`Elapsed: ${response.timestamp_delta_ms}ms since last mutation`)
            );
        });
    });
