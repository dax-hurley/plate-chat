param(
  [Parameter(Mandatory = $true)]
  [string]$ApkPath
)

$ErrorActionPreference = "Stop"

$adb = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path -LiteralPath $adb)) {
  Write-Error "adb not found at $adb - install Android SDK Platform-Tools in Android Studio (SDK Manager)."
  exit 1
}
if (-not (Test-Path -LiteralPath $ApkPath)) {
  Write-Error "APK not found: $ApkPath"
  exit 1
}

# adb cannot reliably stream from \\wsl$\ or \\wsl.localhost\ UNC paths; copy to a local NTFS path first.
$installPkg = $ApkPath
$tempCopy = $null
if ($ApkPath -match '(?i)^\\\\wsl(\.localhost)?\\') {
  $tempCopy = Join-Path $env:TEMP "trainlog-install-debug.apk"
  Copy-Item -LiteralPath $ApkPath -Destination $tempCopy -Force
  $installPkg = $tempCopy
}

$full = (Get-Item -LiteralPath $installPkg).FullName

# Use argument list so PowerShell does not treat "install" or paths oddly (avoids spurious "-S" errors).
$p = Start-Process -FilePath $adb -ArgumentList @("install", "-r", $full) -Wait -PassThru -NoNewWindow
if ($tempCopy -and (Test-Path -LiteralPath $tempCopy)) {
  Remove-Item -LiteralPath $tempCopy -Force -ErrorAction SilentlyContinue
}
exit $p.ExitCode
