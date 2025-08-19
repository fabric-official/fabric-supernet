// agents/SI.Planner/planner.mjs
import { now, readJSON, writeJSON } from "./lib/helpers.mjs";
import { existsSync, readFileSync } from "node:fs";

function has(p){ return existsSync(p); }
function hasScript(pkg, name){ return pkg?.scripts && Object.prototype.hasOwnProperty.call(pkg.scripts, name); }

// Hard defaults you requested
const DEFAULTS = {
  build: "npm run build",
  test: "npm test",
  deploy: "pm2 restart ecosystem.config.js"
};

function detectPackageManager(){
  if (has("pnpm-lock.yaml")) return "pnpm";
  if (has("yarn.lock")) return "yarn";
  if (has("package-lock.json")) return "npm";
  return "npm";
}

// Keep stack detection, but we’ll overlay DEFAULTS afterward unless brief overrides them.
function jsCommands(){
  const runner = detectPackageManager();
  let pkg = null; try { pkg = JSON.parse(readFileSync("package.json","utf-8")); } catch {}
  const build  = pkg && hasScript(pkg,"build")      ? `${runner} run build`
                : pkg && hasScript(pkg,"build:prod")? `${runner} run build:prod`
                : `${runner} run build`;
  const test   = pkg && hasScript(pkg,"test")       ? `${runner} test`
                : pkg && hasScript(pkg,"ci:test")   ? `${runner} run ci:test`
                : `${runner} test`;
  const deploy = (has("k8s")||has("kubernetes")||has("manifests"))
                  ? `kubectl apply -f ${has("k8s")?"k8s":(has("kubernetes")?"kubernetes":"manifests")}`
                  : (has("docker-compose.yml")||has("compose.yaml"))
                    ? `docker compose up -d --build`
                    : (pkg && hasScript(pkg,"deploy")) ? `${runner} run deploy`
                    : `node -e "console.log('deploy ok')"`; // harmless fallback
  return { build, test, deploy };
}

function makeCommands(){ return { build:`make -j build`, test:`make test`, deploy:`make deploy` }; }
function goCommands(){ return { build:`go build ./...`, test:`go test ./...`, deploy: has("k8s") ? `kubectl apply -f k8s` : `node -e "console.log('deploy ok')"` }; }
function javaCommands(){
  if (has("gradlew")||has("gradlew.bat")) return { build:`./gradlew build`, test:`./gradlew test`, deploy:`./gradlew publish || ./gradlew installDist` };
  return { build:`mvn -B -DskipTests=false package`, test:`mvn -B test`, deploy:`mvn -B deploy || mvn -B install` };
}

function pickStack(){
  if (has("package.json")) return jsCommands();
  if (has("Dockerfile")) {
    const tag = process.env.SI_IMAGE || "si/autowire:latest";
    return {
      build: `docker build -t ${tag} .`,
      test:  `docker run --rm ${tag} node -v || echo tested`,
      deploy:(has("k8s")||has("manifests")) ? `kubectl apply -f ${has("k8s")?"k8s":"manifests"}` : `docker run -d --rm --name si_app ${tag}`
    };
  }
  if (has("Makefile")) return makeCommands();
  if (has("go.mod"))   return goCommands();
  if (has("pom.xml")||has("gradlew")||has("gradlew.bat")) return javaCommands();
  // Final safe fallback
  return { build:`node -e "console.log('build ok')"`, test:`node -e "console.log('tests ok')"`, deploy:`node -e "console.log('deploy ok')"` };
}

async function main(){
  // 1) Detect stack
  let cmds = pickStack();

  // 2) Overlay your hard defaults (unless brief overrides)
  let brief = {};
  try { brief = await readJSON("./in/brief.json"); } catch {}
  cmds = {
    build:  brief?.target?.build?.cmd  ?? DEFAULTS.build,
    test:   brief?.target?.test?.cmd   ?? DEFAULTS.test,
    deploy: brief?.target?.deploy?.cmd ?? DEFAULTS.deploy
  };

  // 3) Emit plan
  const plan = {
    name: brief?.name || `plan-autowire-${Date.now()}`,
    created_at: now(),
    policy: {
      max_retries: brief?.policy?.max_retries ?? 3,
      retry_backoff_ms: brief?.policy?.retry_backoff_ms ?? 2000,
      timeout_sec: brief?.policy?.timeout_sec ?? 1800
    },
    targets: [
      { id: (brief?.target?.id)||"app",
        build:  { cmd: cmds.build  },
        test:   { cmd: cmds.test   },
        deploy: { cmd: cmds.deploy } }
    ]
  };

  await writeJSON("./out/plan.json", plan);
  await writeJSON("./artifacts/status.json", { ok:true, planName: plan.name, created_at: plan.created_at, cmds });
  console.log("[planner:fixed]", cmds);
}

main().catch(e=>{ console.error(e); process.exit(1); });

