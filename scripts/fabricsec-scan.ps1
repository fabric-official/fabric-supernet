$signals = @(
  "SMOKE_OK","crashReporter.start(","requireCapability(","export.artifact","agent.start","agent.publish",
  "scopeFile(","registry.pub","wifi.scan","wifi.join","wifi.join.macos","device:challenge","device:prove","device:register",
  "git.pull","git.push","git.creds","CryptProtectData","trusted-types","TrustedTypes","DOMPurify","eval disabled",
  "devices.json","nonces.json","createHmac(""sha256""","plugin:catalog:list","plugin:install","plugin:remove",
  "RBAC: not authed","electron-builder.yml","updates.check","updates.quitAndInstall","licenses.summary","fabric.runtime.ts"
)
$present=@(); $missing=@()
Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
  $t = Get-Content -Raw -ErrorAction SilentlyContinue $_.FullName
  foreach($s in $signals){ if($t -and ($t.IndexOf($s,[StringComparison]::OrdinalIgnoreCase) -ge 0)){ if(-not ($present -contains $s)){ $present += $s } } }
}
foreach($s in $signals){ if(-not ($present -contains $s)){ $missing += $s } }
$present | ForEach-Object { "✔ $_" } | Set-Content -Encoding utf8 .\fabricsec_present.txt
$missing | ForEach-Object { "✖ $_" } | Set-Content -Encoding utf8 .\fabricsec_missing.txt
Write-Host "`n-- PRESENT --"; Get-Content .\fabricsec_present.txt | Select-Object -First 50
Write-Host "`n-- MISSING --"; Get-Content .\fabricsec_missing.txt | Select-Object -First 50