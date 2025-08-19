param([string]$Root = $env:SI_PROJECT_ROOT)
$ErrorActionPreference = "Stop"
if (-not $Root) { $Root = "D:\Fabric\fabric-supernet" }
$env:SI_PROJECT_ROOT = $Root
$env:SI_WATCH_URL   = "http://127.0.0.1:8080/healthz"

# PLAN
cd $Root\agents\SI.Planner; node planner.mjs; cd $Root
$plan = "$Root\agents\SI.Planner\out\plan.json"
Copy-Item $plan "$Root\agents\SI.Sentry.Policy\in\plan.json" -Force
Copy-Item $plan "$Root\agents\SI.Builder\in\plan.json"       -Force
Copy-Item $plan "$Root\agents\SI.Tester\in\plan.json"        -Force
Copy-Item $plan "$Root\agents\SI.Deployer\in\plan.json"      -Force

# RUN
cd $Root\agents\SI.Sentry.Policy; node sentry.mjs; cd $Root
cd $Root\agents\SI.Builder;       node builder.mjs; cd $Root
cd $Root\agents\SI.Tester;        node tester.mjs;  cd $Root
cd $Root\agents\SI.Deployer;      node deployer.mjs;cd $Root
cd $Root\agents\SI.Watcher;       node watcher.mjs --one-shot; cd $Root

# REGISTER
cd $Root\agents\SI.Registrar
Copy-Item "$Root\agents\SI.Builder\out\build.json"   ".\in\build.json"   -Force
Copy-Item "$Root\agents\SI.Tester\out\test.json"     ".\in\test.json"    -Force
Copy-Item "$Root\agents\SI.Deployer\out\deploy.json" ".\in\deploy.json"  -Force
if (Test-Path "$Root\agents\SI.Watcher\out\health.json") { Copy-Item "$Root\agents\SI.Watcher\out\health.json" ".\in\health.json" -Force }
if (Test-Path "$Root\agents\SI.Sentry.Policy\out\policy.json") { Copy-Item "$Root\agents\SI.Sentry.Policy\out\policy.json" ".\in\policy.json" -Force }
node registrar.mjs
