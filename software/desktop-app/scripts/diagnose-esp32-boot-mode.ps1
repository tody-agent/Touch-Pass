param(
  [string]$Port = "COM3",
  [string]$Esptool = "$env:LOCALAPPDATA\Arduino15\packages\esp32\tools\esptool_py\5.3.1\esptool.exe"
)

$ErrorActionPreference = "Stop"

if (!(Test-Path $Esptool)) {
  Write-Output "ERROR esptool not found: $Esptool"
  exit 2
}

$output = & $Esptool --chip esp32s3 -p $Port read-mem 0x60004038 2>&1 | Out-String
Write-Output $output.Trim()

$match = [regex]::Match($output, "0x60004038\s+=\s+0x([0-9a-fA-F]+)")
if (!$match.Success) {
  Write-Output "BOOT_MODE_UNKNOWN could not read GPIO_STRAP_REG"
  exit 3
}

$strap = [Convert]::ToUInt32($match.Groups[1].Value, 16)
$mode = $strap -band 0x0f
$modeHex = "0x{0:x}" -f $mode

if (($mode -band 0x08) -eq 0x08 -or $mode -eq 0x04) {
  Write-Output "BOOT_MODE_FLASH strap=$('0x{0:x8}' -f $strap) low_nibble=$modeHex"
  exit 0
}

if (($mode -band 0x0c) -eq 0x00 -or $mode -eq 0x06 -or $mode -eq 0x07) {
  Write-Output "BOOT_MODE_DOWNLOAD strap=$('0x{0:x8}' -f $strap) low_nibble=$modeHex"
  Write-Output "Release BOOT/IO0, press RESET once, or replug without holding BOOT."
  exit 1
}

Write-Output "BOOT_MODE_OTHER strap=$('0x{0:x8}' -f $strap) low_nibble=$modeHex"
exit 4
