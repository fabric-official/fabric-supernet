# tools\Scan-SuperNet.ps1
# SuperNet “what’s left?” scanner — read-only, prints a checklist + writes next_steps.md
$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$ok   = [char]0x2705
$bad  = [char]0x274C
$warn = [char]0x26A0
function Has($p){ Test-Path $p }
function Hit($label,$present){ "{0} {1}" -f ($present?$ok:$bad), $label }

$checks = @(
  @{ key="mint_runtime_facade"; label="runtime mint façade (runtime/mint-runtime.* present)"; present=(Has "runtime\mint-runtime.js" -and Has "runtime\mint-runtime.ps1") },
  @{ key="staged_pkg";         label="staged pkg-*/ in artifacts/staging (minted/packaged bundle)"; present=(Get-ChildItem -Path "artifacts\staging" -ErrorAction SilentlyContinue -Directory -Filter "pkg-*") },
  @{ key="network_mint_sources"; label="staged NetworkAgent minting sources (minting_kernel.cpp, minting_manager.cpp, weight_loader.cpp)"; present=(
        $pkg = (Get-ChildItem -Path "artifacts\staging" -Directory -Filter "pkg-*" | Sort-Object LastWriteTime -Descending | Select-Object -First 1);
        if($pkg){
          (Has (Join-Path $pkg.FullName 'agents\NetworkAgent\src\minting_kernel.cpp')) -and
          (Has (Join-Path $pkg.FullName 'agents\NetworkAgent\src\minting_manager.cpp')) -and
          (Has (Join-Path $pkg.FullName 'agents\NetworkAgent\src\weight_loader.cpp'))
        } else { $false }
  )},
  @{ key="policies_dir";       label="policies/ directory with machine-enforceable bundles"; present=(Has "policies") },
  @{ key="os_hooks";           label="LaptopAgent OS hooks present (agents/laptop/os-hooks/<win|mac|linux>)"; present=(Has "agents\laptop\os-hooks") },
  @{ key="wifi_fw";            label="WiFiAgent firmware scaffold (agents/wifi/firmware/)"; present=(Has "agents\wifi\firmware") },
  @{ key="drone_fw";           label="DroneAgent firmware/images scaffold (agents/drone/firmware or agents/drone/images)"; present=(Has "agents\drone\firmware" -or Has "agents\drone\images") },
  @{ key="mobile_scaffold";    label="Mobile scaffolds (apps/mobile-android|apps/mobile-ios or equivalent)"; present=(Has "apps\mobile-android" -or Has "apps\mobile-ios") },
  @{ key="desktop_app";        label="Desktop host app (apps/desktop)"; present=(Has "apps\desktop") },
  @{ key="provenance_client";  label="Provenance client service (services/provenance-client)"; present=(Has "services\provenance-client") },
  @{ key="dag_explorer";       label="DAG Explorer service (services/dag-explorer)"; present=(Has "services\dag-explorer") },
  @{ key="treasury_bridge";    label="Treasury bridge service (services/treasury-bridge)"; present=(Has "services\treasury-bridge") },
  @{ key="udap_service";       label="UDAP pairing service (services/udap)"; present=(Has "services\udap") },
  @{ key="fabpkg_tool";        label="fabpkg exporter (tools/fabpkg.ps1)"; present=(Has "tools\fabpkg.ps1") },
  @{ key="release_ci";         label="release workflow with attestation (e.g. .github/workflows/release.yml)"; present=(Has ".github\workflows\release.yml") },
  @{ key="policy_tests";       label="policy regression tests (tests/policy or similar)"; present=(Has "tests\policy") },
  @{ key="sim_removed";        label="no simulated_logs/ in repo root"; present= -not (Has "simulated_logs") },
  @{ key="weights_base";       label="weights base present (weights/base/*.bin)"; present=(Get-ChildItem -Path "weights\base" -Filter *.bin -ErrorAction SilentlyContinue) },
  @{ key="weights_minted";     label="weights minted present (weights/minted/**)"; present=(Has "weights\minted") }
)

# Print to console
"=== SuperNet readiness scan ({0}) ===" -f $root
foreach($c in $checks){
  $present = $c.present
  $label   = $c.label
  $sign    = if($present){ $ok } else { $bad }
  "{0} {1}" -f $sign, $label
}

# Compute “next to implement”
$missing = $checks | Where-Object { -not $_.present } | Select-Object -ExpandProperty key
$todo = @()

if ($missing -contains "policies_dir")       { $todo += "Publish machine-enforceable policy bundles under /policies (GDPR/HIPAA/etc.) with versioned JSON + tests." }
if ($missing -contains "policy_tests")       { $todo += "Add regression tests under /tests/policy/ to verify policy seals, budgets, and denial paths." }
if ($missing -contains "os_hooks")           { $todo += "Add LaptopAgent OS hooks under /agents/laptop/os-hooks/<win|mac|linux>/ with installer + notarization steps." }
if ($missing -contains "wifi_fw")            { $todo += "Add OpenWRT/RouterOS firmware feed under /agents/wifi/firmware/ + tools/wifi-flash.ps1 (SDK-dependent build)." }
if ($missing -contains "drone_fw")           { $todo += "Add DroneAgent firmware/images scaffold under /agents/drone/{firmware,images}/ with field beacon configs." }
if ($missing -contains "mobile_scaffold")    { $todo += "Add mobile scaffolds /apps/mobile-android and /apps/mobile-ios with pairing/approvals (SDK-dependent build)." }
if ($missing -contains "desktop_app")        { $todo += "Add desktop host app under /apps/desktop (Electron or .NET) for approvals/wallet UI." }
if ($missing -contains "provenance_client")  { $todo += "Add /services/provenance-client (immutable Merkle write path) and wire agents to it." }
if ($missing -contains "dag_explorer")       { $todo += "Add /services/dag-explorer for lineage/royalty visualization used by dashboard/apps." }
if ($missing -contains "treasury_bridge")    { $todo += "Add /services/treasury-bridge for paymaster/royalty settlement and claim flows." }
if ($missing -contains "udap_service")       { $todo += "Add /services/udap implementing QR + Passkeys/WebAuthn device binding (pairing plane)." }
if ($missing -contains "fabpkg_tool")        { $todo += "Add tools/fabpkg.ps1 to export .fabpkg (sign, checksums, SBOM) + GitHub release job." }
if ($missing -contains "release_ci")         { $todo += "Add .github/workflows/release.yml (SLSA/Cosign attest, artifact signing, versioned tags)." }
if ($missing -contains "weights_base")       { $todo += "Ensure base weights exist under /weights/base/*.bin (10–100MB per agent) for mint bursts." }
if ($missing -contains "weights_minted")     { $todo += "Ensure minted weights under /weights/minted/epoch-*/ are produced (façade verifies staging only)." }
if ($missing -contains "staged_pkg")         { $todo += "Run pack/stage to create artifacts/staging/pkg-* (or run runtime/mint-runtime.ps1 -NoBuild once staging exists)." }
if ($missing -contains "network_mint_sources"){ $todo += "Verify packer includes NetworkAgent minting sources in staged pkg (minting_kernel/manager/weight_loader)." }
if ($missing -contains "sim_removed")        { $todo += "Remove simulated_logs/ and replace with provenance writes." }
if ($missing -contains "mint_runtime_facade"){ $todo += "Keep runtime/mint-runtime.* checked in (you’ve already added these) and wire CI smoke." }

# Write next_steps.md
$lines = @()
$lines += "# SuperNet build readiness"
$lines += ""
$lines += "## Status"
foreach($c in $checks){
  $sign = if($c.present){ $ok } else { $bad }
  $lines += "* {0} {1}" -f $sign, $c.label
}
$lines += ""
$lines += "## Next to implement"
if ($todo.Count -gt 0) {
  $i=1
  foreach($t in $todo){ $lines += "{0}. {1}" -f $i,$t; $i++ }
} else {
  $lines += "Nothing critical missing per scanner."
}
$lines | Set-Content -Encoding UTF8 (Join-Path $root "next_steps.md")

"`nWrote next_steps.md`n"
