import path from 'path';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { Command } from 'commander';

const TEMPLATE_DIR = path.resolve(__dirname, '../templates/connector');
const CONNECTORS_ROOT = path.resolve(process.cwd(), 'connectors');

async function run() {
    const program = new Command();
    program
        .name('fab init-connector')
        .description('Scaffold a new UDAP connector')
        .option('-n, --name <name>', 'Connector name (e.g. kafka-connector)')
        .option('-t, --type <type>', 'Connector type (e.g. Kafka, S3, MQTT)')
        .option('-u, --url <url>', 'Endpoint URL or connection string')
        .parse(process.argv);

    const opts = program.opts();

    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Connector name:',
            validate: v => !!v || 'Name is required',
            default: opts.name,
        },
        {
            type: 'list',
            name: 'type',
            message: 'Connector type:',
            choices: ['Kafka', 'S3', 'JDBC', 'REST', 'MQTT', 'OPC-UA', 'Custom'],
            default: opts.type ?? 'Custom',
        },
        {
            type: 'input',
            name: 'url',
            message: 'Endpoint URL or connection string:',
            validate: v => !!v || 'URL is required',
            default: opts.url,
        },
    ]);

    const { name, type, url } = answers;
    const dest = path.join(CONNECTORS_ROOT, name);

    if (await fs.pathExists(dest)) {
        console.error(`Connector directory "${name}" already exists at ${dest}`);
        process.exit(1);
    }

    // Copy template folder
    await fs.copy(TEMPLATE_DIR, dest);

    // Replace placeholders in each file
    for (const file of ['connector.ts', 'README.md', 'package.json']) {
        const p = path.join(dest, file);
        let content = await fs.readFile(p, 'utf8');
        content = content
            .replace(/__CONNECTOR_NAME__/g, name)
            .replace(/__CONNECTOR_TYPE__/g, type)
            .replace(/__CONNECTOR_URL__/g, url);
        await fs.writeFile(p, content, 'utf8');
    }

    console.log(`Successfully initialized connector '${name}' at ${dest}`);
}

run().catch(err => {
    console.error('Error initializing connector:', err);
    process.exit(1);
});
