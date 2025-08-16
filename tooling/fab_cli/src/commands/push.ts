import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import fsExtra from 'fs-extra';

const FABRIC_MODELS_REPO = 'https://github.com/fab-project-V1/fabric-models.git';
const LOCAL_CLONE_DIR = path.resolve(__dirname, '../../../.fabric-models-tmp');

export async function pushModelToGitHub(modelName: string, version: string) {
    const modelPath = path.resolve('models', modelName, version);

    if (!fs.existsSync(modelPath)) {
        console.error(chalk.red(`❌ Model not found at: ${modelPath}`));
        process.exit(1);
    }

    try {
        console.log(chalk.blue(`📦 Preparing to push model ${modelName}:${version} to Fabric public registry...`));

        // ✅ Clone if needed
        if (!fs.existsSync(LOCAL_CLONE_DIR)) {
            console.log(chalk.gray(`🔄 Cloning fabric-models repo to ${LOCAL_CLONE_DIR}...`));
            execSync(`git clone ${FABRIC_MODELS_REPO} "${LOCAL_CLONE_DIR}"`, { stdio: 'inherit' });
        }

        const destDir = path.join(LOCAL_CLONE_DIR, modelName, version);
        await fsExtra.ensureDir(destDir);
        await fsExtra.copy(modelPath, destDir, { overwrite: true });

        process.chdir(LOCAL_CLONE_DIR);

        // Stage and commit if needed
        execSync('git add .', { stdio: 'inherit' });
        const status = execSync('git status --porcelain').toString().trim();
        if (status) {
            execSync(`git commit -m "Add ${modelName}:${version}"`, { stdio: 'inherit' });
        } else {
            console.log(chalk.yellow('⚠️  No new changes to commit.'));
        }

        execSync('git push origin main', { stdio: 'inherit' });
        console.log(chalk.green(`✅ Model ${modelName}:${version} pushed successfully.`));
    } catch (err: any) {
        console.error(chalk.red(`❌ Failed to push model: ${err.message}`));
        process.exit(1);
    }
}

export { pushModelToGitHub as pushModel };
