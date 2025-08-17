param(
  [Parameter(Mandatory=$true)][ValidateSet("Protect","Unprotect")]$Mode,
  [ValidateSet("CurrentUser","LocalMachine")]$Scope="CurrentUser",
  [Parameter(Mandatory=$true)][string]$InBase64
)
$bytes = [Convert]::FromBase64String($InBase64)
$scopeEnum = if($Scope -eq 'LocalMachine'){ [System.Security.Cryptography.DataProtectionScope]::LocalMachine } else { [System.Security.Cryptography.DataProtectionScope]::CurrentUser }
try {
  if ($Mode -eq "Protect") {
    $out = [System.Security.Cryptography.ProtectedData]::Protect($bytes,$null,$scopeEnum)
  } else {
    $out = [System.Security.Cryptography.ProtectedData]::Unprotect($bytes,$null,$scopeEnum)
  }
  [Console]::Out.Write([Convert]::ToBase64String($out))
  exit 0
} catch {
  [Console]::Error.WriteLine($_.Exception.Message)
  exit 1
}