"use strict";
// tooling/fab-cli/src/commands/rollback.ts
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
exports.rollbackCommand = void 0;
const commander_1 = require("commander");
const grpc = __importStar(require("@grpc/grpc-js"));
const protoLoader = __importStar(require("@grpc/proto-loader"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const PROTO_PATH = path_1.default.resolve(__dirname, "../../proto/audit.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const auditProto = grpc.loadPackageDefinition(packageDefinition).fab;
exports.rollbackCommand = new commander_1.Command("rollback")
    .description("Rewind the atom to the last valid state")
    .requiredOption("--atom <id>", "Atom ID to rollback")
    .action(async (options) => {
    const client = new auditProto.AuditService("localhost:50052", grpc.credentials.createInsecure());
    const request = { atom_id: options.atom };
    client.RollbackAtom(request, (err, response) => {
        if (err) {
            console.error(chalk_1.default.red(`❌ Rollback failed: ${err.message}`));
            process.exit(1);
        }
        if (response.status !== "OK") {
            console.error(chalk_1.default.red(`❌ Rollback denied: ${response.reason || "Unknown reason"}`));
            process.exit(1);
        }
        console.log(chalk_1.default.green("✅ Rollback successful"));
        console.log(chalk_1.default.gray(`Before:  ${response.previous_hash}`));
        console.log(chalk_1.default.gray(`After:   ${response.current_hash}`));
        console.log(chalk_1.default.gray(`Elapsed: ${response.timestamp_delta_ms}ms since last mutation`));
    });
});
//# sourceMappingURL=rollback.js.map