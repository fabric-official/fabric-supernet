#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const program = new commander_1.Command();
/**
 * Load a compliance profile, extracting its policy block clauses.
 */
function loadProfile(profileName) {
    const profilePath = path_1.default.resolve(__dirname, '..', '..', 'compliance', `${profileName}.profile`);
    if (!fs_1.default.existsSync(profilePath)) {
        throw new Error(`Profile not found: ${profileName}`);
    }
    const content = fs_1.default.readFileSync(profilePath, 'utf8');
    const policyMatch = content.match(/policy\s*\{\s*([\s\S]*?)\s*\}/m);
    if (!policyMatch) {
        throw new Error(`No policy { … } block found in ${profileName}.profile`);
    }
    // Split on commas at top level (not inside parentheses)
    const body = policyMatch[1]
        .replace(/\r\n/g, '\n') // normalize line endings
        .split('\n')
        .join(' ') // collapse lines
        .trim();
    // now split by commas not inside parentheses
    const clauses = body
        .split(/,(?![^(]*\))/g)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    return { name: profileName, clauses };
}
/**
 * Extract the first top-level policy { … } block from the .fab source.
 */
function extractModulePolicy(source) {
    const policyMatch = source.match(/^\s*policy\s*\{\s*([\s\S]*?)^\s*\}/m);
    if (!policyMatch) {
        throw new Error('No top-level policy { … } block found in module');
    }
    // Collapse whitespace and newlines for easy substring matching
    return policyMatch[1].replace(/\r\n/g, '\n').split('\n').join(' ').trim();
}
program
    .name('fab compliance')
    .description('Run a compliance profile check on a Fabric .fab module')
    .argument('<module>', 'Path to the .fab module file')
    .option('-p, --profile <profile>', 'Compliance profile name (GDPR, CCPA, HIPAA)', 'GDPR')
    .action((modulePath, options) => {
    try {
        // Resolve module file
        const absPath = path_1.default.resolve(process.cwd(), modulePath);
        if (!fs_1.default.existsSync(absPath)) {
            console.error(`❌ Module file not found: ${absPath}`);
            process.exit(1);
        }
        // Load profile
        const profile = loadProfile(options.profile);
        console.log(`✅ Loaded profile: ${profile.name}`);
        // Read source and extract its global policy block
        const source = fs_1.default.readFileSync(absPath, 'utf8');
        const modPolicyBody = extractModulePolicy(source);
        // Check each clause
        const missing = [];
        for (const clause of profile.clauses) {
            if (!modPolicyBody.includes(clause)) {
                missing.push(clause);
            }
        }
        if (missing.length) {
            console.error('❌ Compliance violation: the following clauses are missing:');
            for (const c of missing)
                console.error(`  • ${c}`);
            process.exit(1);
        }
        console.log('🎉 Compliance check passed: all profile clauses are present.');
    }
    catch (err) {
        console.error(`❌ Compliance check failed: ${err.message}`);
        process.exit(1);
    }
});
program.parse(process.argv);
//# sourceMappingURL=compliance.js.map