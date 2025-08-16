#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// tooling/fab-cli/src/monitor.ts
const commander_1 = require("commander");
const child_process_1 = require("child_process");
const node_fetch_1 = __importDefault(require("node-fetch"));
const path_1 = __importDefault(require("path"));
const program = new commander_1.Command();
program
    .name('fab monitor')
    .description('Monitor a running Fabric runtime (logs or metrics)')
    .option('--local', 'Tail local Docker Compose logs', false)
    .option('--remote <url>', 'Poll metrics endpoint at given base URL')
    .option('-i, --interval <seconds>', 'Polling interval for metrics (default: 5s)', (v) => {
    const n = parseInt(v, 10);
    if (isNaN(n) || n <= 0)
        throw new Error('Interval must be a positive number');
    return n;
}, 5)
    .action(async (options) => {
    if (options.local) {
        // Tail Docker Compose logs
        const composeFile = path_1.default.resolve(process.cwd(), 'apps/urban-dreamweaving/config/docker-compose.yml');
        console.log(`⏱ Tailing logs from ${composeFile} (last 100 lines)...`);
        const logs = (0, child_process_1.spawn)('docker-compose', ['-f', composeFile, 'logs', '-f', '--tail', '100'], { stdio: 'inherit' });
        logs.on('exit', code => process.exit(code ?? 0));
    }
    else if (options.remote) {
        // Poll remote metrics endpoint
        const base = options.remote.replace(/\/+$/, '');
        const metricsUrl = `${base}/metrics`;
        console.log(`⏱ Polling metrics from ${metricsUrl} every ${options.interval}s`);
        while (true) {
            try {
                const res = await (0, node_fetch_1.default)(metricsUrl);
                if (!res.ok) {
                    console.error(`❌ HTTP ${res.status} fetching metrics`);
                }
                else {
                    const text = await res.text();
                    console.clear();
                    console.log(`== Metrics @ ${new Date().toISOString()} ==\n`);
                    console.log(text);
                }
            }
            catch (err) {
                console.error(`❌ Fetch error: ${err.message}`);
            }
            // wait
            await new Promise(resolve => setTimeout(resolve, options.interval * 1000));
        }
    }
    else {
        console.error('Please specify either --local (logs) or --remote <url> (metrics).');
        process.exit(1);
    }
});
program.parse(process.argv);
//# sourceMappingURL=monitor.js.map