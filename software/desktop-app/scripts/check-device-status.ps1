param(
  [string]$Port = "COM3",
  [int]$Baud = 115200,
  [int]$TimeoutSeconds = 6
)

if ($IsWindows -or $env:OS -eq "Windows_NT") {
  try {
    $pnputil = pnputil /enum-devices /connected /class Ports 2>$null | Out-String
    $portPattern = "VID_303A&PID_1001[\s\S]{0,240}$([regex]::Escape($Port))"
    if ($pnputil -match $portPattern) {
      Write-Output "BOOTLOADER_MODE $Port VID_303A PID_1001"
      exit 3
    }
  } catch {
    # Fall through to the serial probe on platforms without pnputil.
  }
}

$serial = [System.IO.Ports.SerialPort]::new($Port, $Baud)
$serial.NewLine = "`r`n"
$serial.ReadTimeout = 1000
$serial.WriteTimeout = 1000
$serial.DtrEnable = $false
$serial.RtsEnable = $false

try {
  $serial.Open()
  Start-Sleep -Milliseconds 800
  $serial.Write("PING`r`n")
  Start-Sleep -Milliseconds 200
  $serial.Write("STATUS`r`n")

  $lines = @()
  $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
  while ([DateTime]::UtcNow -lt $deadline) {
    try {
      $line = $serial.ReadLine()
      if ($line) { $lines += $line.Trim() }
    } catch [TimeoutException] {}
  }

  if ($lines.Count -eq 0) {
    Write-Output "NO_RESPONSE"
    exit 2
  }

  $lines | ForEach-Object { Write-Output $_ }
  if ($lines -match "^OK STATUS") {
    exit 0
  }
  exit 1
} finally {
  if ($serial.IsOpen) {
    $serial.Close()
  }
}
