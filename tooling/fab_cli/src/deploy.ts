#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'child_process';

const program = new Command();

program
    .name('fab deploy')
    .description('Deploy a compiled Fabric module to a Fabric runtime')
    .argument(
        '<module>',
        'Module name (without .fab) or path to its build directory'
    )
    .option('--local', 'Deploy to a local Fabric runtime (docker-compose)', false)
    .option('--remote <url>', 'URL of remote Fabric control API')
    .action((moduleArg: string, options: { local: boolean; remote?: string }) => {
        try {
            // Resolve build directory
            let buildDir: string;
            if (fs.existsSync(path.resolve(moduleArg)) && fs.lstatSync(moduleArg).isDirectory()) {
                buildDir = moduleArg;
            } else {
                buildDir = path.join(process.cwd(), 'build', moduleArg);
            }
            if (!fs.existsSync(buildDir)) {
                console.error(`❌ Build directory not found: ${buildDir}`);
                process.exit(1);
            }

            if (options.local) {
                console.log(`🚀 Deploying '${moduleArg}' locally via docker-compose...`);
                // Ensure docker-compose picks up ./build
                execSync(
                    'docker-compose -f apps/urban-dreamweaving/config/docker-compose.yml up -d',
                    { stdio: 'inherit' }
                );
            } else if (options.remote) {
                const apiUrl = options.remote.replace(/\/+$/, '');
                console.log(`🚀 Deploying '${moduleArg}' to remote runtime at ${apiUrl}...`);

                // Create a tarball of the build dir
                const tarName = `${moduleArg}.tar.gz`;
                console.log(`📦 Archiving build directory to ${tarName}...`);
                execSync(`tar -czf ${tarName} -C ${path.dirname(buildDir)} ${path.basename(buildDir)}`, {
                    stdio: 'inherit',
                });

                // POST the tarball
                console.log(`📤 Uploading to ${apiUrl}/deploy...`);
                const curl = spawnSync(
                    'curl',
                    [
                        '-X', 'POST',
                        `${apiUrl}/deploy`,
                        '-H', 'Content-Type: application/gzip',
                        '--data-binary', `@${tarName}`,
                    ],
                    { stdio: 'inherit' }
                );
                if (curl.status !== 0) {
                    console.error('❌ Remote upload failed');
                    process.exit(1);
                }

                // Clean up
                fs.unlinkSync(tarName);
            } else {
                console.error('❌ Please specify either `--local` or `--remote <url>`');
                process.exit(1);
            }

            console.log('✅ Deployment complete.');
        } catch (err: any) {
            console.error(`❌ Deployment failed: ${err.message}`);
            process.exit(1);
        }
    });

program.parse(process.argv);

