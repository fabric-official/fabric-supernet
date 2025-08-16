$ErrorActionPreference="Stop"
function Fail($m){ Write-Host "[FAIL] $m" -ForegroundColor Red; exit 1 }
$files = Get-ChildItem -Path ".\policies" -Filter *.json
if(-not $files){ Fail "no policy jsons found" }
$bad=@()
foreach($f in $files){
  try{
    $obj = Get-Content $f.FullName -Raw | ConvertFrom-Json -ErrorAction Stop
    $req = "policy_version","policy_id","target_agent","description","issued_at","provenance_required","audit_trail","default_action","rules","resource_limits","allowed_endpoints","retention","integrity"
    foreach($k in $req){ if(-not $obj.PSObject.Properties.Name -contains $k){ $bad += "$($f.Name): missing $k" } }
    if($obj.default_action -ne "deny"){ $bad += "$($f.Name): default_action must be 'deny'" }
    if(@($obj.rules).Count -eq 0){ $bad += "$($f.Name): rules empty" }
    $ban = @("stub","TODO","placeholder","TBD","shim")
    $txt = Get-Content $f.FullName -Raw
    foreach($b in $ban){ if($txt -match [regex]::Escape($b)){ $bad += "$($f.Name): contains banned string '$b'" } }
  } catch { $bad += "$($f.Name): json parse error - $($_.Exception.Message)" }
}
if($bad.Count -gt 0){ $bad | %{ Write-Host "[X] $_" -ForegroundColor Red }; Fail "policy validation failed" }
Write-Host "[OK] policies validate" -ForegroundColor Green