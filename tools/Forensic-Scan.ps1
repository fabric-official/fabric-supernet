$ErrorActionPreference='Stop'

function Ensure-Dir([string]$p){ if(-not (Test-Path -LiteralPath $p)){ New-Item -ItemType Directory -Force -Path $p | Out-Null } }
function Write-Utf8NoBom([string]$Path,[string]$Text){ $dir=Split-Path -Parent $Path; if($dir){ Ensure-Dir $dir }; $enc=New-Object System.Text.UTF8Encoding($false); [IO.File]::WriteAllText($Path,$Text,$enc) }
function CmdPath([string]$name){ $c = Get-Command $name -ErrorAction SilentlyContinue; if($c){ $c.Source } else { $null } }
function ToJson($o){ $o | ConvertTo-Json -Depth 10 }

$ROOT = (Get-Location).Path
$OUTD = Join-Path $ROOT 'artifacts\reports'
Ensure-Dir $OUTD

# A) Environment/tooling
$os = (Get-CimInstance Win32_OperatingSystem).Caption
$psv = $PSVersionTable.PSVersion.ToString()
$envInfo = [ordered]@{
  os                 = $os
  powershell_version = $psv
  cmake              = (CmdPath 'cmake')
  ninja              = (CmdPath 'ninja')
  cl                 = (CmdPath 'cl')
  clang              = (CmdPath 'clang')
  gpp                = (CmdPath 'g++')
  node               = (CmdPath 'node')
  git                = (CmdPath 'git')
}

# B) Agents: discover actual dirs and verify key scripts exist
$agentDirs = Get-ChildItem .\agents -Directory -ErrorAction SilentlyContinue
$canon = @(
  @{ label='FabricGovernor';      pats=@('*FabricGovernor*','*Governor*') },
  @{ label='AtomicMemoryDBAgent'; pats=@('*AtomicMemoryDBAgent*','*MemoryDB*') },
  @{ label='NetworkAgent';        pats=@('*NetworkAgent*','*Network*') },
  @{ label='WiFiAgent';           pats=@('*WiFiAgent*','*wifi*') },
  @{ label='DroneAgent';          pats=@('*DroneAgent*','*drone*') },
  @{ label='LaptopAgent';         pats=@('*LaptopAgent*','*laptop*') },
  @{ label='SmartphoneAgent';     pats=@('*SmartphoneAgent*','*smartphone*') }
)
$req = @{
  FabricGovernor      = @(@('policy_kernel.cpp','governance_loop.cpp'),@('audit_trail.cpp','audit.cpp'),@('consensus_router.cpp'))
  AtomicMemoryDBAgent = @(@('memory_persistor.cpp','persistor.cpp'),@('memory_exchange.cpp','exchange.cpp'),@('royalty_from_memory.cpp'),@('treasury.cpp'))
  NetworkAgent        = @(@('handshake.cpp'),@('minting_manager.cpp'),@('weight_loader.cpp'),@('agent_directory.json','agent_directory.yaml','agent_directory.yml'))
  WiFiAgent           = @(@('packet_router.cpp'),@('swarm_balancer.cpp'),@('treasury.cpp'))
  DroneAgent          = @(@('uplink.cpp'),@('signal_extender.cpp'),@('drone_id_beacon.cpp'),@('audit_delta.cpp'))
  LaptopAgent         = @(@('os_hook_init.cpp','os-hooks'),@('browser_watch.cpp'),@('exec_multiplex.cpp'),@('energy_meter.cpp'),@('treasury.cpp'))
  SmartphoneAgent     = @(@('init_device_brain.cpp'),@('bandwidth_client.cpp'),@('agent_task_queue.py'),@('treasury.cpp'))
}
function Resolve-Agent([string]$label){
  foreach($c in $canon){
    if($c.label -ne $label){ continue }
    foreach($p in $c.pats){
      $hit = $agentDirs | Where-Object { $_.Name -like $p } | Select-Object -First 1
      if($hit){ return $hit.FullName }
    }
  }
  return $null
}
function Find-Any([string]$base,[string[]]$names){
  foreach($n in $names){
    $hit = Get-ChildItem -Path $base -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -ieq $n } | Select-Object -First 1
    if($hit){ return $hit.FullName }
    if($n -eq 'os-hooks'){
      $dhit = Get-ChildItem -Path $base -Recurse -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -ieq 'os-hooks' } | Select-Object -First 1
      if($dhit){ return $dhit.FullName }
    }
  }
  return $null
}
$agentChecks=@()
foreach($label in $req.Keys){
  $root = Resolve-Agent $label
  $items=@()
  if(-not $root){ $agentChecks += [ordered]@{agent=$label; present=$false; root=$null; items=@()}; continue }
  foreach($alts in $req[$label]){
    $hit = Find-Any -base $root -names $alts
    $ok = $false
    if($hit){
      if((Test-Path $hit -PathType Leaf) -and ((Get-Item $hit).Length -ge 50)){ $ok=$true }
      if((Test-Path $hit -PathType Container)){ $ok=$true }
    }
    $items += [ordered]@{ candidates=$alts; hit=$hit; ok=$ok }
  }
  $agentChecks += [ordered]@{ agent=$label; present=$true; root=$root; items=$items }
}

# C) Weights
$weights = @(
  @{ name='governor.bin';   min=95MB; max=105MB },
  @{ name='memorydb.bin';   min=10MB; max=20MB  },
  @{ name='wifi.bin';       min=10MB; max=20MB  },
  @{ name='network.bin';    min=10MB; max=20MB  },
  @{ name='drone.bin';      min=10MB; max=20MB  },
  @{ name='laptop.bin';     min=10MB; max=20MB  },
  @{ name='smartphone.bin'; min=10MB; max=20MB  }
)
function CheckW([string]$base){
  $r=@()
  foreach($w in $weights){
    $p = Join-Path $base $w.name
    $present = Test-Path $p
    $len = 0
    if($present){ $len = (Get-Item $p).Length }
    $sizeMB = [Math]::Round(($len/1MB),2)
    $inRange = ($present -and $len -ge $w.min -and $len -le $w.max)
    $r += [ordered]@{ file=$w.name; path=$p; present=$present; sizeMB=$sizeMB; inRange=$inRange }
  }
  $r
}
$repoWeights   = CheckW ".\weights\base"
$pkgLatest     = Get-ChildItem -Path "artifacts\staging" -Directory -Filter "pkg-*" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$pkgWeights    = @()
if($pkgLatest){ $pkgWeights = CheckW (Join-Path $pkgLatest.FullName 'weights\base') }
$pkgCurrentDir = ".\build\supernet\pkg-current"
$pkgCurWeights = @()
if(Test-Path $pkgCurrentDir){ $pkgCurWeights = CheckW (Join-Path $pkgCurrentDir 'weights\base') }

# D) Packaging flags (avoid ternary)
$pkg_latest_name = $null
if($pkgLatest){ $pkg_latest_name = $pkgLatest.Name }
$pack = [ordered]@{
  mint_runtime_js  = (Test-Path '.\runtime\mint-runtime.js')
  mint_runtime_ps1 = (Test-Path '.\runtime\mint-runtime.ps1')
  staged_pkg_found = ($pkgLatest -ne $null)
  pkg_latest_name  = $pkg_latest_name
  pkg_current_dir  = (Test-Path $pkgCurrentDir)
  fabpkg_tool      = (Test-Path '.\tools\fabpkg.ps1')
  fabpkg_zip       = (Test-Path '.\artifacts\release\supernet.fabpkg.zip')
  release_workflow = (Test-Path '.github\workflows\release.yml')
}

# E) Empty dirs and placeholder strings
$emptyDirs = Get-ChildItem -Recurse -Directory -ErrorAction SilentlyContinue | Where-Object {
  (Get-ChildItem -LiteralPath $_.FullName -Force -ErrorAction SilentlyContinue | Where-Object { -not $_.PSIsContainer }).Count -eq 0
} | Select-Object -ExpandProperty FullName
$badTerms = @('stub','TODO','TBD','placeholder','Replace with real','shim')
$allFiles = Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue
$badFinds=@()
foreach($t in $badTerms){
  $hits = $allFiles | Select-String -Pattern $t -SimpleMatch -ErrorAction SilentlyContinue
  if($hits){ $badFinds += $hits }
}
$badList = $badFinds | Select-Object Path,LineNumber,Line

# F) Build blockers
$buildBlockers = @()
if(-not $envInfo.cmake){ $buildBlockers += "CMake not in PATH" }
if(-not $envInfo.cl -and -not $envInfo.clang -and -not $envInfo.gpp){ $buildBlockers += "No C/C++ compiler in PATH" }
if(-not $envInfo.ninja){ $buildBlockers += "Ninja not in PATH" }
if(-not $pack.staged_pkg_found){ $buildBlockers += "No artifacts\staging\pkg-* present" }

# G) Score
$missingAgents=@()
foreach($ac in $agentChecks){
  if(-not $ac.present){ $missingAgents += $ac.agent; continue }
  $bad = $false
  foreach($i in $ac.items){ if(-not $i.ok){ $bad=$true } }
  if($bad){ $missingAgents += $ac.agent }
}
$score = [ordered]@{
  agents_ok        = ($missingAgents.Count -eq 0)
  weights_repo_ok  = ((($repoWeights | Where-Object { -not $_.inRange }).Count) -eq 0)
  weights_staged_ok= ((($pkgWeights  | Where-Object { -not $_.inRange }).Count) -eq 0)
  packaging_ok     = ($pack.mint_runtime_js -and $pack.mint_runtime_ps1 -and $pack.staged_pkg_found)
  placeholders_ok  = ($badList.Count -eq 0)
}

# H) Emit JSON + Markdown
$report = [ordered]@{
  repo_root     = $ROOT
  env           = $envInfo
  packaging     = $pack
  agents        = $agentChecks
  weights_repo  = $repoWeights
  weights_staged= $pkgWeights
  weights_build = $pkgCurWeights
  empty_dirs    = $emptyDirs
  placeholders  = $badList
  build_blockers= $buildBlockers
  score         = $score
  timestamp     = (Get-Date).ToString('o')
}
Write-Utf8NoBom (Join-Path $OUTD 'forensic_report.json') (ToJson $report)

$md=@()
$md+= "# SuperNet Forensic Report"
$md+= ""
$md+= "* Generated: $($report.timestamp)"
$md+= "* OS: $($envInfo.os); PowerShell: $($envInfo.powershell_version)"
$md+= "* Tooling — cmake: $($envInfo.cmake); ninja: $($envInfo.ninja); cl: $($envInfo.cl); clang: $($envInfo.clang); g++: $($envInfo.gpp)"
$md+= ""
$md+= "## Agents"
foreach($a in $agentChecks){
  $md+= "* **$($a.agent)** present=$($a.present) root=$($a.root)"
  foreach($i in $a.items){ $md+= "  * $($i.candidates -join ' | '): ok=$($i.ok) hit=$($i.hit)" }
}
$md+= ""
$md+= "## Weights (repo)"; foreach($w in $repoWeights){ $md+= "* $($w.file): present=$($w.present) sizeMB=$($w.sizeMB) inRange=$($w.inRange)" }
$md+= "## Weights (staged)"; foreach($w in $pkgWeights){ $md+= "* $($w.file): present=$($w.present) sizeMB=$($w.sizeMB) inRange=$($w.inRange)" }
$md+= "## Weights (build pkg-current)"; foreach($w in $pkgCurWeights){ $md+= "* $($w.file): present=$($w.present) sizeMB=$($w.sizeMB) inRange=$($w.inRange)" }
$md+= ""
$md+= "## Packaging"
$md+= "* staged pkg present: $($pack.staged_pkg_found) $($pack.pkg_latest_name)"
$md+= "* pkg-current dir: $($pack.pkg_current_dir)"
$md+= "* fabpkg tool: $($pack.fabpkg_tool); fabpkg zip: $($pack.fabpkg_zip); release workflow: $($pack.release_workflow)"
$md+= ""
$md+= "## Empty Directories ($($emptyDirs.Count))"
foreach($e in $emptyDirs){ $md+= "* $e" }
$md+= ""
$md+= "## Placeholder Strings ($($badList.Count))"
foreach($p in $badList){ $md+= "* $($p.Path):$($p.LineNumber) — $($p.Line.Trim())" }
$md+= ""
$md+= "## Build Blockers"
if($buildBlockers.Count -eq 0){ $md+= "* none" } else { foreach($b in $buildBlockers){ $md+= "* $b" } }
$md+= ""
$md+= "## Score"
foreach($kv in $score.GetEnumerator()){ $md+= "* $($kv.Key): $($kv.Value)" }

Write-Utf8NoBom (Join-Path $OUTD 'forensic_report.md') ($md -join "`r`n")
Write-Host "[done] forensic_report.json + forensic_report.md"
