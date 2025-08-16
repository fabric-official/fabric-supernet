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
// parser / checker / errors:
const parser_1 = require("@fabric_v1/compiler/frontend/parser");
const checker_1 = require("@fabric_v1/compiler/frontend/checker");
const errors_1 = require("@fabric_v1/compiler/frontend/errors");
// IR compiler entrypoint:
// this path exists and TS can find its types
const compiler_1 = require("@fabric_v1/compiler/lib/ir/compiler");
// backend lowering & emitters — use require() to bypass TS missing-module checks
// (we'll type it as any)
const { lowerToLLVM, lowerToWasm, emitQasm, emitQuil } = require('@fabric_v1/compiler/backend');
const program = new commander_1.Command();
program
    .name('fab build')
    .description('Compile and package a Fabric .fab module')
    .argument('<modulePath>', 'Path to the .fab module file')
    .option('-o, --out-dir <dir>', 'Output directory', 'build')
    .option('--docker-image <name>', 'Name for the Docker image', 'fabric-module:latest')
    .action(async (modulePath, options) => {
    try {
        // Resolve and read source
        const absPath = path_1.default.resolve(process.cwd(), modulePath);
        if (!fs_1.default.existsSync(absPath)) {
            console.error(`Module file not found: ${absPath}`);
            process.exit(1);
        }
        console.log(`Parsing ${modulePath}`);
        const source = fs_1.default.readFileSync(absPath, 'utf8');
        const ast = (0, parser_1.parse)(source, modulePath);
        console.log('Running semantic checks');
        (0, checker_1.runSemanticChecks)(ast);
        console.log('Lowering to IR');
        const irModule = (0, compiler_1.compileToIR)(ast, {});
        const mlir = irModule.toString();
        // Write MLIR
        const mlirDir = path_1.default.join(options.outDir, 'mlir');
        fs_1.default.mkdirSync(mlirDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(mlirDir, 'module.mlir'), mlir);
        // Generate LLVM IR
        console.log('Generating LLVM IR');
        const llvmIR = lowerToLLVM(irModule);
        const llvmDir = path_1.default.join(options.outDir, 'llvm');
        fs_1.default.mkdirSync(llvmDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(llvmDir, 'program.ll'), llvmIR);
        (0, child_process_1.spawnSync)('llvm_codegen', ['program.ll'], { cwd: llvmDir, stdio: 'inherit' });
        // Generate WebAssembly
        console.log('Generating WebAssembly module');
        const wasmBin = lowerToWasm(irModule);
        const wasmDir = path_1.default.join(options.outDir, 'wasm');
        fs_1.default.mkdirSync(wasmDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(wasmDir, 'module.wasm'), wasmBin);
        (0, child_process_1.spawnSync)('wasm_codegen', ['module.wasm'], { cwd: wasmDir, stdio: 'inherit' });
        // Emit OpenQASM
        console.log('Emitting OpenQASM');
        const qasmText = emitQasm(irModule);
        const qasmDir = path_1.default.join(options.outDir, 'qasm');
        fs_1.default.mkdirSync(qasmDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(qasmDir, 'program.qasm'), qasmText);
        (0, child_process_1.spawnSync)('qasm_emitter', ['program.qasm'], { cwd: qasmDir, stdio: 'inherit' });
        // Emit Quil
        console.log('Emitting Quil');
        const quilText = emitQuil(irModule);
        const quilDir = path_1.default.join(options.outDir, 'quil');
        fs_1.default.mkdirSync(quilDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(quilDir, 'program.quil'), quilText);
        (0, child_process_1.spawnSync)('quil_emitter', ['program.quil'], { cwd: quilDir, stdio: 'inherit' });
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
        fs_1.default.writeFileSync(path_1.default.join(options.outDir, 'Dockerfile'), dockerfile);
        // Build Docker image
        console.log('Building Docker image');
        const buildRes = (0, child_process_1.spawnSync)('docker', ['build', '-t', options.dockerImage, '.'], {
            cwd: options.outDir,
            stdio: 'inherit'
        });
        if (buildRes.status !== 0)
            throw new Error('Docker build failed');
        // Write deploy helper
        console.log('Writing deploy.sh');
        const deploySh = `#!/usr/bin/env bash
# Deploy this Fabric module locally
docker run --rm -it ${options.dockerImage} bash
      `;
        const deployPath = path_1.default.join(options.outDir, 'deploy.sh');
        fs_1.default.writeFileSync(deployPath, deploySh);
        fs_1.default.chmodSync(deployPath, 0o755);
        console.log(`🎉 Build succeeded. Artifacts in ${options.outDir}`);
    }
    catch (err) {
        if (err instanceof errors_1.SemanticError) {
            console.error(`Semantic error: ${err.message}`);
        }
        else {
            console.error(`Build failed: ${err.message}`);
        }
        process.exit(1);
    }
});
program.parse(process.argv);
//# sourceMappingURL=build.js.map