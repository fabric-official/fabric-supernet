"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const inquirer_1 = __importDefault(require("inquirer"));
const commander_1 = require("commander");
const TEMPLATE_DIR = path_1.default.resolve(__dirname, '../templates/connector');
const CONNECTORS_ROOT = path_1.default.resolve(process.cwd(), 'connectors');
async function run() {
    const program = new commander_1.Command();
    program
        .name('fab init-connector')
        .description('Scaffold a new UDAP connector')
        .option('-n, --name <name>', 'Connector name (e.g. kafka-connector)')
        .option('-t, --type <type>', 'Connector type (e.g. Kafka, S3, MQTT)')
        .option('-u, --url <url>', 'Endpoint URL or connection string')
        .parse(process.argv);
    const opts = program.opts();
    const answers = await inquirer_1.default.prompt([
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
    const dest = path_1.default.join(CONNECTORS_ROOT, name);
    if (await fs_extra_1.default.pathExists(dest)) {
        console.error(`Connector directory "${name}" already exists at ${dest}`);
        process.exit(1);
    }
    // Copy template folder
    await fs_extra_1.default.copy(TEMPLATE_DIR, dest);
    // Replace placeholders in each file
    for (const file of ['connector.ts', 'README.md', 'package.json']) {
        const p = path_1.default.join(dest, file);
        let content = await fs_extra_1.default.readFile(p, 'utf8');
        content = content
            .replace(/__CONNECTOR_NAME__/g, name)
            .replace(/__CONNECTOR_TYPE__/g, type)
            .replace(/__CONNECTOR_URL__/g, url);
        await fs_extra_1.default.writeFile(p, content, 'utf8');
    }
    console.log(`Successfully initialized connector '${name}' at ${dest}`);
}
run().catch(err => {
    console.error('Error initializing connector:', err);
    process.exit(1);
});
//# sourceMappingURL=init-connector.js.map