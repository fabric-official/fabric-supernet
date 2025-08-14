# tools\Require-AgentScripts.ps1
$ErrorActionPreference='Stop'

function Fail($m){ Write-Host "[FAIL] $m"; exit 1 }
function Req($ok,$m){ if($ok){ Write-Host "[OK]   $m" } else { Write-Host "[FAIL] $m"; $script:FAIL++ } }

# A) Discover actual agent dirs under .\agents
if(-not (Test-Path .\agents)){ Fail "agents/ not found" }
$agents = Get-ChildItem .\agents -Directory

# map expected labels -> matching patterns -> actual path
$expected = @(
  @{ label='FabricGovernor';      pats=@('*FabricGovernor*','*Governor*') },
  @{ label='AtomicMemoryDBAgent'; pats=@('*AtomicMemoryDBAgent*','*MemoryDB*') },
  @{ label='NetworkAgent';        pats=@('*NetworkAgent*','*Network*') },
  @{ label='WiFiAgent';           pats=@('*WiFiAgent*','*wifi*') },
  @{ label='DroneAgent';          pats=@('*DroneAgent*','*drone*') },
  @{ label='LaptopAgent';         pats=@('*LaptopAgent*','*laptop*') },
  @{ label='SmartphoneAgent';     pats=@('*SmartphoneAgent*','*smartphone*') }
)

$agentMap = @{}
foreach($e in $expected){
  $hit = $null
  foreach($p in $e.pats){
    $hit = $agents | ? { $_.Name -like $p } | Select-Object -First 1
    if($hit){ break }
  }
  if($hit){ $agentMap[$e.label] = $hit.FullName; Write-Host "[OK] agent: $($e.label) => $($hit.FullName)" }
  else     { Write-Host "[MISS] agent dir not found for $($e.label)"; $agentMap[$e.label] = $null }
}

# B) Required scripts per agent (accept ANY of the names in each item)
$req = @{
  FabricGovernor      = @(
    @('policy_kernel.cpp','governance_loop.cpp'),
    @('audit_trail.cpp','audit.cpp'),
    @('consensus_router.cpp')
  )
  AtomicMemoryDBAgent = @(
    @('memory_persistor.cpp'),
    @('memory_exchange.cpp'),
    @('royalty_from_memory.cpp'),
    @('treasury.cpp')
  )
  NetworkAgent        = @(
    @('handshake.cpp'),
    @('minting_manager.cpp'),
    @('weight_loader.cpp'),
    @('agent_directory.json','agent_directory.yaml','agent_directory.yml')
  )
  WiFiAgent           = @(
    @('packet_router.cpp'),
    @('swarm_balancer.cpp'),
    @('treasury.cpp')
  )
  DroneAgent          = @(
    @('uplink.cpp'),
    @('signal_extender.cpp'),
    @('drone_id_beacon.cpp'),
    @('audit_delta.cpp')
  )
  LaptopAgent         = @(
    @('os_hook_init.cpp'),
    @('browser_watch.cpp'),
    @('exec_multiplex.cpp'),
    @('energy_meter.cpp'),
    @('treasury.cpp')
  )
  SmartphoneAgent     = @(
    @('init_device_brain.cpp'),
    @('bandwidth_client.cpp'),
    @('agent_task_queue.py'),
    @('treasury.cpp')
  )
}

# C) Locate latest staged pkg to backfill from
$pkg = Get-ChildItem -Path "artifacts\staging" -Directory -Filter "pkg-*" -ErrorAction SilentlyContinue |
       Sort-Object LastWriteTime -Descending | Select-Object -First 1
if($null -eq $pkg){ Write-Host "[WARN] no artifacts\staging\pkg-* available; backfill disabled" }

# D) Helper: find one of the candidate names under a base path
function Find-Candidate([string]$base,[string[]]$names){
  foreach($n in $names){
    $hit = Get-ChildItem -Path $base -Recurse -File -ErrorAction SilentlyContinue |
           Where-Object { $_.Name -ieq $n } | Select-Object -First 1
    if($hit){ return $hit }
  }
  return $null
}

# E) Enforce presence; backfill from staged pkg if missing; harden
$script:FAIL = 0
$placed = @()

foreach($label in $req.Keys){
  $root = $agentMap[$label]
  if(-not $root){ Req $false "agent missing: $label"; continue }

  foreach($alts in $req[$label]){
    # 1) does any candidate already exist under repo agent root?
    $hit = Find-Candidate -base $root -names $alts
    if(-not $hit -and $pkg){
      # 2) try to pull from staged package under agents\{label}\**
      $pkgBase = Join-Path $pkg.FullName "agents\$label"
      if(Test-Path $pkgBase){
        $hitPkg = Find-Candidate -base $pkgBase -names $alts
        if($hitPkg){
          # copy into repo under agents\{label}\src (default)
          $dstDir = Join-Path $root 'src'
          if(-not (Test-Path $dstDir)){ New-Item -ItemType Directory -Force -Path $dstDir | Out-Null }
          $dst = Join-Path $dstDir $hitPkg.Name
          Copy-Item -Force $hitPkg.FullName $dst
          $placed += $dst
          $hit = Get-Item $dst
          Write-Host "[backfill] $label <- $($hitPkg.Name)"
        }
      }
    }

    # 3) verify now
    if($hit){
      # size > 100 bytes, and no placeholder markers
      $okSize = ($hit.Length -ge 100)
      $bad = $false
      if($hit.Length -gt 0){
        $line = Get-Content -TotalCount 1 -Path $hit.FullName -ErrorAction SilentlyContinue
        # quick scan (full scan right after)
      }
      $markers = @('stub','TODO','TBD','placeholder','Replace with real','shim')
      $mHits = @()
      foreach($m in $markers){
        $mHits += Select-String -Path $hit.FullName -Pattern $m -SimpleMatch -ErrorAction SilentlyContinue
      }
      $bad = ($mHits.Count -gt 0)
      Req ($okSize -and -not $bad) ("$label: has " + ($alts -join ' OR '))
      if($bad){
        Write-Host "       markers found in $($hit.FullName)"; $script:FAIL++
      }
      if(-not $okSize){
        Write-Host "       too small: $($hit.FullName) ($($hit.Length) bytes)"; $script:FAIL++
      }
    } else {
      Req $false ("$label: missing " + ($alts -join ' OR '))
    }
  }
}

if($placed.Count -gt 0){
  Write-Host "`n[info] backfilled files:"; $placed | ForEach-Object { Write-Host "  $_" }
}

if($script:FAIL -gt 0){ Write-Host "`nENFORCE FAILED ($script:FAIL)"; exit 1 }
Write-Host "`nENFORCE PASS"; exit 0
