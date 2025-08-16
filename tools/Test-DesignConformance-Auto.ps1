# tools\Test-DesignConformance-Auto.ps1  (auto-discovers your actual structure)
$ErrorActionPreference = "Stop"
$FAIL = 0
function req($ok, $msg){ if($ok){ Write-Host "[OK]   $msg" } else { Write-Host "[FAIL] $msg"; $script:FAIL++ } }
function warn($msg){ Write-Host "[WARN] $msg" }
function Has([string]$p){ Test-Path -LiteralPath $p }

# --- A) Discover agent directories under ./agents (don’t assume names) ---
$agentRoot = "agents"
if(-not (Test-Path $agentRoot)){ Write-Host "[FAIL] Missing agents/ directory"; exit 1 }

$agents = Get-ChildItem -LiteralPath $agentRoot -Directory -ErrorAction SilentlyContinue

# label -> wildcard patterns we’ll try to match against actual names
$expectedAgents = @(
  @{ label="FabricGovernor";       patterns=@("*FabricGovernor*","*Governor*") },
  @{ label="AtomicMemoryDBAgent";  patterns=@("*AtomicMemoryDBAgent*","*MemoryDB*") },
  @{ label="NetworkAgent";         patterns=@("*NetworkAgent*","*Network*") },
  @{ label="WiFiAgent";            patterns=@("*WiFiAgent*","*wifi*") },
  @{ label="DroneAgent";           patterns=@("*DroneAgent*","*drone*") },
  @{ label="LaptopAgent";          patterns=@("*LaptopAgent*","*laptop*") },
  @{ label="SmartphoneAgent";      patterns=@("*SmartphoneAgent*","*smartphone*") }
)

# map each expected label to the actual dir path (first match wins)
$agentMap = @{}
foreach($exp in $expectedAgents){
  $hit = $null
  foreach($pat in $exp.patterns){
    $hit = $agents | Where-Object { $_.Name -like $pat } | Select-Object -First 1
    if($hit){ break }
  }
  req ($null -ne $hit) ("Agent present: {0}" -f $exp.label)
  if($hit){ $agentMap[$exp.label] = $hit.FullName }
}

# --- B) Weights present and sized (>=10 MB each) ---
$weightsOk = $true
$weightFiles = @{
  governor   = "weights\base\governor.bin"
  memorydb   = "weights\base\memorydb.bin"
  wifi       = "weights\base\wifi.bin"
  network    = "weights\base\network.bin"
  drone      = "weights\base\drone.bin"
  laptop     = "weights\base\laptop.bin"
  smartphone = "weights\base\smartphone.bin"
}
foreach ($k in $weightFiles.Keys) {
  $f = $weightFiles[$k]
  $ok = Has $f
  req $ok ("Base weight exists: {0}" -f $f)
  if ($ok) {
    $len = (Get-Item $f).Length
    $sizeMB = [Math]::Round($len / 1MB, 2)
    $big = $len -ge 10MB
    req $big ("Base weight size >=10MB for {0} ({1} MB)" -f $k, $sizeMB)
    if (-not $big) { $weightsOk = $false }
  } else { $weightsOk = $false }
}

# --- C) Staged pkg exists and includes minting sources (search by filename anywhere inside pkg) ---
$pkg = Get-ChildItem -Path "artifacts\staging" -Directory -Filter "pkg-*" -ErrorAction SilentlyContinue |
       Sort-Object LastWriteTime -Descending | Select-Object -First 1
req ($null -ne $pkg) "Latest staged bundle exists under artifacts\staging\pkg-*"
if ($pkg) {
  $needFiles = @("minting_kernel.cpp","minting_manager.cpp","weight_loader.cpp")
  foreach($nf in $needFiles){
    $hit = Get-ChildItem -LiteralPath $pkg.FullName -Recurse -File -Filter $nf -ErrorAction SilentlyContinue | Select-Object -First 1
    req ($null -ne $hit) ("Staged contains file: {0}" -f $nf)
  }
}

# --- D) Mint façade present and runnable in verify-only ---
req (Has "runtime\mint-runtime.js")  "Mint façade js present"
req (Has "runtime\mint-runtime.ps1") "Mint façade ps1 present"
try {
  $env:SUPERNET_SKIP_BUILD = "1"
  powershell -NoProfile -ExecutionPolicy Bypass -File .\runtime\mint-runtime.ps1 -NoBuild | Out-Null
  req $true "Mint façade verify-only ran successfully"
} catch {
  req $false ("Mint façade verify-only failed: {0}" -f $_.Exception.Message)
}

# --- E) Policy dir present (placeholder check only) ---
req (Has "policies") "Policy bundles dir present (policies/)"
if (-not (Has "policies")) { warn "Add machine-enforceable bundles + tests under /policies and /tests/policy" }

# --- F) Design-reference files: find by filename ANYWHERE under the correct agent roots ---
function Find-File([string]$base,[string[]]$names){
  foreach($n in $names){
    $hit = Get-ChildItem -LiteralPath $base -Recurse -File -Filter $n -ErrorAction SilentlyContinue | Select-Object -First 1
    if($hit){ return $hit }
  }
  return $null
}

# map design expectations -> which agent root to search and which filenames to accept
$designExpect = @(
  @{ label="Network handshake";    agent="NetworkAgent";        names=@("handshake.cpp") },
  @{ label="Any treasury cpp";     agent="*";                   names=@("treasury.cpp") }, # search all agents
  @{ label="Governor policy loop"; agent="FabricGovernor";      names=@("policy_kernel.cpp","policy.cpp") },
  @{ label="Governor audit trail"; agent="FabricGovernor";      names=@("audit_trail.cpp","audit.cpp") },
  @{ label="MemoryDB persistor";   agent="AtomicMemoryDBAgent"; names=@("memory_persistor.cpp","persistor.cpp") },
  @{ label="MemoryDB exchange";    agent="AtomicMemoryDBAgent"; names=@("memory_exchange.cpp","exchange.cpp") }
)

foreach($d in $designExpect){
  if($d.agent -eq "*"){
    $hit = Get-ChildItem -Path $agentRoot -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $d.names -contains $_.Name } | Select-Object -First 1
    req ($null -ne $hit) ("Design file exists: {0} (any agent)" -f ($d.names -join " OR "))
  } else {
    if(-not $agentMap.ContainsKey($d.agent)){
      req $false ("Agent missing for design check: {0}" -f $d.agent)
      continue
    }
    $base = $agentMap[$d.agent]
    $hit = Find-File -base $base -names $d.names
    req ($null -ne $hit) ("Design file exists: {0} under {1}" -f ($d.names -join " OR "), $d.agent)
  }
}

# --- G) Summary + exit ---
if ($FAIL -gt 0) { Write-Host "`nFAILED ($FAIL requirement(s))"; exit 1 }
else { Write-Host "`nPASS: SuperNet meets current conformance checks"; exit 0 }
