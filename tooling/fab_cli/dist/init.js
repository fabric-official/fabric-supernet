#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// tooling/fab-cli/src/init.ts
const commander_1 = require("commander");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const inquirer_1 = __importDefault(require("inquirer"));
const program = new commander_1.Command();
program
    .name('fab init')
    .description('Interactive scaffold for a new Fabric 1.0 project')
    .action(async () => {
    // 1) Ask for project name
    const { projectName } = await inquirer_1.default.prompt([
        {
            name: 'projectName',
            type: 'input',
            message: 'Project directory name (will be created if it does not exist):',
            default: '.',
            validate: input => input.trim() === '' ? 'Name cannot be empty' : true,
        }
    ]);
    const rootDir = path_1.default.resolve(process.cwd(), projectName === '.' ? '' : projectName);
    // 2) Confirm overwrite if non-empty
    if (fs_1.default.existsSync(rootDir) && fs_1.default.readdirSync(rootDir).length > 0) {
        const { overwrite } = await inquirer_1.default.prompt([{
                name: 'overwrite',
                type: 'confirm',
                message: `Directory ${rootDir} already exists and is not empty. Overwrite?`,
                default: false
            }]);
        if (!overwrite) {
            console.log('Initialization cancelled.');
            process.exit(0);
        }
    }
    // 3) Ask description
    const { description } = await inquirer_1.default.prompt([{
            name: 'description',
            type: 'input',
            message: 'Short project description:',
            default: 'A Fabric 1.0 project'
        }]);
    // 4) Include Urban-Dreamweaving example?
    const { includeApp } = await inquirer_1.default.prompt([{
            name: 'includeApp',
            type: 'confirm',
            message: 'Include the urban-dreamweaving example app scaffold?',
            default: true
        }]);
    // 5) Build directory structure
    const dirs = [
        'apps',
        'compiler/frontend',
        'compiler/ir',
        'compiler/backend/llvm',
        'compiler/backend/wasm',
        'compiler/backend/qasm',
        'compiler/backend/quil',
        'daemon/udap-registry',
        'daemon/symbiosis-fabric',
        'daemon/agent-vm',
        'daemon/provenance-ledger',
        'language-spec/rfcs',
        'ontologies',
        'tooling/fab-cli/src',
        'tooling/ci',
        'examples/classical/assistive-companion',
        'examples/quantum-sim/quantum-sampler',
    ];
    if (includeApp) {
        dirs.push('apps/urban-dreamweaving/config/helm-chart/templates', 'apps/urban-dreamweaving/config');
    }
    dirs.forEach(rel => {
        const full = path_1.default.join(rootDir, rel);
        fs_1.default.mkdirSync(full, { recursive: true });
    });
    // 6) Write README.md
    const readme = `# ${projectName}\n
> ${description}

## Getting Started

- \`fab build <module>.fab\` — compile a .fab module  
- \`fab deploy --local\` — deploy locally via Docker Compose  
- \`fab compliance --profile GDPR\` — run compliance checks  

`;
    fs_1.default.writeFileSync(path_1.default.join(rootDir, 'README.md'), readme);
    // 7) LICENSE placeholder
    fs_1.default.writeFileSync(path_1.default.join(rootDir, 'LICENSE'), 'Apache-2.0');
    // 8) .gitignore
    const gitignore = `
node_modules/
build/
.env
ledger-data/
`;
    fs_1.default.writeFileSync(path_1.default.join(rootDir, '.gitignore'), gitignore);
    // 9) Sample .fab module in examples/classical
    const sampleFab = `module CompanionExample {
  import core, multimodal

  device AnyEdge { caps: [CPU:1core]; policy:{ privacy:anonymized } }

  policy {
    privacy anonymized
  }

  goal "sample assistive vision goal" {
    constraints { latency:<100ms; accuracy:>90% }
    optimize for { comfort, trust }
  }
}
`;
    const samplePath = path_1.default.join(rootDir, 'examples', 'classical', 'assistive-companion', 'CompanionExample.fab');
    fs_1.default.writeFileSync(samplePath, sampleFab);
    // 10) Optionally scaffold the urban-dreamweaving app
    if (includeApp) {
        // Docker Compose
        const dockerCompose = `version: '3.8'
services:
  urban-frontend:
    image: nginx:alpine
    ports: ["3000:80"]
    volumes:
      - ./modules:/usr/share/nginx/html
`;
        const cfgDir = path_1.default.join(rootDir, 'apps', 'urban-dreamweaving', 'config');
        fs_1.default.writeFileSync(path_1.default.join(cfgDir, 'docker-compose.yml'), dockerCompose);
        // Kubernetes Deployment YAML
        const k8sDeployment = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: urban-dreamweaving
  labels:
    app: urban-dreamweaving
spec:
  replicas: 1
  selector:
    matchLabels:
      app: urban-dreamweaving
  template:
    metadata:
      labels:
        app: urban-dreamweaving
    spec:
      containers:
        - name: urban-dreamweaving
          image: urban-dreamweaving:latest
          ports:
            - containerPort: 80
          volumeMounts:
            - name: modules
              mountPath: /usr/share/nginx/html
      volumes:
        - name: modules
          hostPath:
            path: ./modules
`;
        fs_1.default.writeFileSync(path_1.default.join(cfgDir, 'k8s-deployment.yaml'), k8sDeployment);
        // Helm Chart files
        const chartDir = path_1.default.join(cfgDir, 'helm-chart');
        fs_1.default.writeFileSync(path_1.default.join(chartDir, 'Chart.yaml'), `apiVersion: v2
name: urban-dreamweaving
version: 0.1.0
`);
        fs_1.default.writeFileSync(path_1.default.join(chartDir, 'values.yaml'), `replicaCount: 1

image:
  repository: urban-dreamweaving
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

modulesPath: ./modules
`);
        const tpl = path_1.default.join(chartDir, 'templates');
        // Helm Deployment template
        const helmDeploy = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "urban-dreamweaving.fullname" . }}
  labels:
    app: {{ include "urban-dreamweaving.name" . }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: {{ include "urban-dreamweaving.name" . }}
  template:
    metadata:
      labels:
        app: {{ include "urban-dreamweaving.name" . }}
    spec:
      containers:
      - name: {{ include "urban-dreamweaving.name" . }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        imagePullPolicy: {{ .Values.image.pullPolicy }}
        ports:
        - containerPort: {{ .Values.service.port }}
        volumeMounts:
        - name: modules
          mountPath: /usr/share/nginx/html
      volumes:
      - name: modules
        hostPath:
          path: {{ .Values.modulesPath | quote }}
`;
        fs_1.default.writeFileSync(path_1.default.join(tpl, 'deployment.yaml'), helmDeploy);
        // Helm Service template
        const helmService = `apiVersion: v1
kind: Service
metadata:
  name: {{ include "urban-dreamweaving.fullname" . }}
  labels:
    app: {{ include "urban-dreamweaving.name" . }}
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: {{ .Values.service.port }}
      protocol: TCP
      name: http
  selector:
    app: {{ include "urban-dreamweaving.name" . }}
`;
        fs_1.default.writeFileSync(path_1.default.join(tpl, 'service.yaml'), helmService);
        // Module FAB file
        const modDir = path_1.default.join(rootDir, 'apps', 'urban-dreamweaving', 'modules');
        fs_1.default.writeFileSync(path_1.default.join(modDir, 'AssistiveVision.fab'), sampleFab);
    }
    console.log(`\n✅ Fabric project initialized at ${rootDir}`);
});
program.parse(process.argv);
//# sourceMappingURL=init.js.map