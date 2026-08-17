<#
.SYNOPSIS
    TouchPass Windows Smart Card Certificate Enrollment & Verification Script
.DESCRIPTION
    Verifies smart card driver status, checks PIV container presence, and guides AD / Entra CBA enrollment.
#>

param(
    [string]$Upn = "$env:USERNAME@$env:USERDNSDOMAIN",
    [switch]$VerifyOnly
)

Write-Host "==> Checking Windows Smart Card Resource Manager (scardsvr)..." -ForegroundColor Cyan
$scardsvr = Get-Service -Name "SCardSvr" -ErrorAction SilentlyContinue
if ($null -eq $scardsvr -or $scardsvr.Status -ne "Running") {
    Write-Warning "Smart Card service is not running. Attempting to start..."
    Start-Service -Name "SCardSvr" -ErrorAction SilentlyContinue
}

Write-Host "==> Probing connected PIV smart cards via certutil..." -ForegroundColor Cyan
$certutilOutput = certutil -scinfo 2>&1 | Out-String

if ($certutilOutput -match "No smart cards available" -or $certutilOutput -match "Cannot find a smart card") {
    Write-Warning "No TouchPass PIV device detected. Please connect your USB hardware."
} else {
    Write-Host "  ✓ Smart card subsystem responded successfully." -ForegroundColor Green
}

if ($VerifyOnly) {
    Write-Host "Verification complete." -ForegroundColor Green
    exit 0
}

Write-Host "Enrollment target UPN: $Upn" -ForegroundColor Yellow
Write-Host "Please use your Enterprise CA or TouchPass Desktop App to complete Slot 9A certificate mapping." -ForegroundColor Gray
