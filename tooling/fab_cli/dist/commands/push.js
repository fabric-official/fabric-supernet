"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushModelToGitHub = pushModelToGitHub;
exports.pushModel = pushModelToGitHub;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const FABRIC_MODELS_REPO = 'https://github.com/fab-project-V1/fabric-models.git';
const LOCAL_CLONE_DIR = path_1.default.resolve(__dirname, '../../../.fabric-models-tmp');
async function pushModelToGitHub(modelName, version) {
    const modelPath = path_1.default.resolve('models', modelName, version);
    if (!fs_1.default.existsSync(modelPath)) {
        console.error(chalk_1.default.red(`❌ Model not found at: ${modelPath}`));
        process.exit(1);
    }
    try {
        console.log(chalk_1.default.blue(`📦 Preparing to push model ${modelName}:${version} to Fabric public registry...`));
        // ✅ Clone if needed
        if (!fs_1.default.existsSync(LOCAL_CLONE_DIR)) {
            console.log(chalk_1.default.gray(`🔄 Cloning fabric-models repo to ${LOCAL_CLONE_DIR}...`));
            (0, child_process_1.execSync)(`git clone ${FABRIC_MODELS_REPO} "${LOCAL_CLONE_DIR}"`, { stdio: 'inherit' });
        }
        const destDir = path_1.default.join(LOCAL_CLONE_DIR, modelName, version);
        await fs_extra_1.default.ensureDir(destDir);
        await fs_extra_1.default.copy(modelPath, destDir, { overwrite: true });
        process.chdir(LOCAL_CLONE_DIR);
        // Stage and commit if needed
        (0, child_process_1.execSync)('git add .', { stdio: 'inherit' });
        const status = (0, child_process_1.execSync)('git status --porcelain').toString().trim();
        if (status) {
            (0, child_process_1.execSync)(`git commit -m "Add ${modelName}:${version}"`, { stdio: 'inherit' });
        }
        else {
            console.log(chalk_1.default.yellow('⚠️  No new changes to commit.'));
        }
        (0, child_process_1.execSync)('git push origin main', { stdio: 'inherit' });
        console.log(chalk_1.default.green(`✅ Model ${modelName}:${version} pushed successfully.`));
    }
    catch (err) {
        console.error(chalk_1.default.red(`❌ Failed to push model: ${err.message}`));
        process.exit(1);
    }
}
//# sourceMappingURL=push.js.map