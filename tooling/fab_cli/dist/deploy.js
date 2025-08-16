#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const program = new commander_1.Command();
program
    .name('fab deploy')
    .description('Deploy a compiled Fabric module to a Fabric runtime')
    .argument('<module>', 'Module name (without .fab) or path to its build directory')
    .option('--local', 'Deploy to a local Fabric runtime (docker-compose)', false)
    .option('--remote <url>', 'URL of remote Fabric control API')
    .action((moduleArg, options) => {
    try {
        // Resolve build directory
        let buildDir;
        if (fs_1.default.existsSync(path_1.default.resolve(moduleArg)) && fs_1.default.lstatSync(moduleArg).isDirectory()) {
            buildDir = moduleArg;
        }
        else {
            buildDir = path_1.default.join(process.cwd(), 'build', moduleArg);
        }
        if (!fs_1.default.existsSync(buildDir)) {
            console.error(`❌ Build directory not found: ${buildDir}`);
            process.exit(1);
        }
        if (options.local) {
            console.log(`🚀 Deploying '${moduleArg}' locally via docker-compose...`);
            // Ensure docker-compose picks up ./build
            (0, child_process_1.execSync)('docker-compose -f apps/urban-dreamweaving/config/docker-compose.yml up -d', { stdio: 'inherit' });
        }
        else if (options.remote) {
            const apiUrl = options.remote.replace(/\/+$/, '');
            console.log(`🚀 Deploying '${moduleArg}' to remote runtime at ${apiUrl}...`);
            // Create a tarball of the build dir
            const tarName = `${moduleArg}.tar.gz`;
            console.log(`📦 Archiving build directory to ${tarName}...`);
            (0, child_process_1.execSync)(`tar -czf ${tarName} -C ${path_1.default.dirname(buildDir)} ${path_1.default.basename(buildDir)}`, {
                stdio: 'inherit',
            });
            // POST the tarball
            console.log(`📤 Uploading to ${apiUrl}/deploy...`);
            const curl = (0, child_process_1.spawnSync)('curl', [
                '-X', 'POST',
                `${apiUrl}/deploy`,
                '-H', 'Content-Type: application/gzip',
                '--data-binary', `@${tarName}`,
            ], { stdio: 'inherit' });
            if (curl.status !== 0) {
                console.error('❌ Remote upload failed');
                process.exit(1);
            }
            // Clean up
            fs_1.default.unlinkSync(tarName);
        }
        else {
            console.error('❌ Please specify either `--local` or `--remote <url>`');
            process.exit(1);
        }
        console.log('✅ Deployment complete.');
    }
    catch (err) {
        console.error(`❌ Deployment failed: ${err.message}`);
        process.exit(1);
    }
});
program.parse(process.argv);
//# sourceMappingURL=deploy.js.map