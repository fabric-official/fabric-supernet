"use strict";
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
exports.monitorCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const grpc = __importStar(require("@grpc/grpc-js"));
const protoLoader = __importStar(require("@grpc/proto-loader"));
const path_1 = __importDefault(require("path"));
// Load gRPC definition
const PROTO_PATH = path_1.default.join(__dirname, '..', '..', 'proto', 'audit.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const auditProto = grpc.loadPackageDefinition(packageDefinition).audit;
// Create gRPC client
const client = new auditProto.AuditLogger('localhost:50051', grpc.credentials.createInsecure());
// Monitor logic
function streamAtomEvents() {
    const stream = client.StreamMutations({});
    stream.on('data', (event) => {
        const { agent_id, timestamp, operation, proton_index, electron_index, policy_result, energy_delta, } = event;
        const opColor = operation === 'collapse'
            ? chalk_1.default.bold.yellow
            : policy_result === 'allowed'
                ? chalk_1.default.green
                : chalk_1.default.red;
        const energy = energy_delta > 0
            ? chalk_1.default.blue(`+${energy_delta}`)
            : chalk_1.default.magenta(`${energy_delta}`);
        console.log(`${chalk_1.default.gray(timestamp)} | Agent ${chalk_1.default.cyan(agent_id)} | ` +
            `Op ${opColor(operation)} [P:${proton_index}, E:${electron_index}] ` +
            `| Policy: ${policy_result} | ΔE: ${energy}`);
    });
    stream.on('end', () => {
        console.log(chalk_1.default.gray('Stream ended.'));
    });
    stream.on('error', (err) => {
        console.error(chalk_1.default.red('Stream error:'), err.message);
    });
}
// Register with Commander
exports.monitorCommand = new commander_1.Command('monitor')
    .description('Monitor real-time FabricAtom state changes')
    .command('atoms')
    .description('Stream mutations and collapses from Fabric audit logger')
    .action(() => {
    console.log(chalk_1.default.bold('🔬 Monitoring atom state changes...'));
    streamAtomEvents();
});
//# sourceMappingURL=monitor.js.map