#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

// parser / checker / errors:
import { parse } from '@fabric_v1/compiler/frontend/parser';
import { runSemanticChecks } from '@fabric_v1/compiler/frontend/checker';
import { SemanticError } from '@fabric_v1/compiler/frontend/errors';

// IR compiler entrypoint:
// this path exists and TS can find its types
import { compileToIR } from '@fabric_v1/compiler/lib/ir/compiler';

// backend lowering & emitters — use require() to bypass TS missing-module checks
// (we'll type it as any)
const {
    lowerToLLVM,
    lowerToWasm,
    emitQasm,
    emitQuil
}: {
    lowerToLLVM: (ir: any) => string;
    lowerToWasm: (ir: any) => Uint8Array;
    emitQasm: (ir: any) => string;
    emitQuil: (ir: any) => string;
} = require('@fabric_v1/compiler/backend');

const program = new Command();

program
    .name('fab build')
    .description('Compile and package a Fabric .fab module')
    .argument('<modulePath>', 'Path to the .fab module file')
    .option('-o, --out-dir <dir>', 'Output directory', 'build')
    .option('--docker-image <name>', 'Name for the Docker image', 'fabric-module:latest')
    .action(async (modulePath: string, options: { outDir: string; dockerImage: string }) => {
        try {
            // Resolve and read source
            const absPath = path.resolve(process.cwd(), modulePath);
            if (!fs.existsSync(absPath)) {
                console.error(`Module file not found: ${absPath}`);
                process.exit(1);
            }

            console.log(`Parsing ${modulePath}`);
            const source = fs.readFileSync(absPath, 'utf8');
            const ast = parse(source, modulePath);

            console.log('Running semantic checks');
            runSemanticChecks(ast);

            console.log('Lowering to IR');
            const irModule = compileToIR(ast, {} as any);
            const mlir = irModule.toString();

            // Write MLIR
            const mlirDir = path.join(options.outDir, 'mlir');
            fs.mkdirSync(mlirDir, { recursive: true });
            fs.writeFileSync(path.join(mlirDir, 'module.mlir'), mlir);

            // Generate LLVM IR
            console.log('Generating LLVM IR');
            const llvmIR = lowerToLLVM(irModule);
            const llvmDir = path.join(options.outDir, 'llvm');
            fs.mkdirSync(llvmDir, { recursive: true });
            fs.writeFileSync(path.join(llvmDir, 'program.ll'), llvmIR);
            spawnSync('llvm_codegen', ['program.ll'], { cwd: llvmDir, stdio: 'inherit' });

            // Generate WebAssembly
            console.log('Generating WebAssembly module');
            const wasmBin = lowerToWasm(irModule);
            const wasmDir = path.join(options.outDir, 'wasm');
            fs.mkdirSync(wasmDir, { recursive: true });
            fs.writeFileSync(path.join(wasmDir, 'module.wasm'), wasmBin);
            spawnSync('wasm_codegen', ['module.wasm'], { cwd: wasmDir, stdio: 'inherit' });

            // Emit OpenQASM
            console.log('Emitting OpenQASM');
            const qasmText = emitQasm(irModule);
            const qasmDir = path.join(options.outDir, 'qasm');
            fs.mkdirSync(qasmDir, { recursive: true });
            fs.writeFileSync(path.join(qasmDir, 'program.qasm'), qasmText);
            spawnSync('qasm_emitter', ['program.qasm'], { cwd: qasmDir, stdio: 'inherit' });

            // Emit Quil
            console.log('Emitting Quil');
            const quilText = emitQuil(irModule);
            const quilDir = path.join(options.outDir, 'quil');
            fs.mkdirSync(quilDir, { recursive: true });
            fs.writeFileSync(path.join(quilDir, 'program.quil'), quilText);
            spawnSync('quil_emitter', ['program.quil'], { cwd: quilDir, stdio: 'inherit' });

            // Write Dockerfile
            console.log('Writing Dockerfile');
            const dockerfile = `
FROM ubuntu:22.04
COPY llvm/program.ll /opt/fab/
COPY wasm/module.wasm /opt/fab/
COPY qasm/program.qasm /opt/fab/
COPY quil/program.quil /opt/fab/
CMD ["bash"]
      `.trim();
            fs.writeFileSync(path.join(options.outDir, 'Dockerfile'), dockerfile);

            // Build Docker image
            console.log('Building Docker image');
            const buildRes = spawnSync('docker', ['build', '-t', options.dockerImage, '.'], {
                cwd: options.outDir,
                stdio: 'inherit'
            });
            if (buildRes.status !== 0) throw new Error('Docker build failed');

            // Write deploy helper
            console.log('Writing deploy.sh');
            const deploySh = `#!/usr/bin/env bash
# Deploy this Fabric module locally
docker run --rm -it ${options.dockerImage} bash
      `;
            const deployPath = path.join(options.outDir, 'deploy.sh');
            fs.writeFileSync(deployPath, deploySh);
            fs.chmodSync(deployPath, 0o755);

            console.log(`🎉 Build succeeded. Artifacts in ${options.outDir}`);
        } catch (err: any) {
            if (err instanceof SemanticError) {
                console.error(`Semantic error: ${err.message}`);
            } else {
                console.error(`Build failed: ${err.message}`);
            }
            process.exit(1);
        }
    });

program.parse(process.argv);







