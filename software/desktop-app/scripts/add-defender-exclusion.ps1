<#
.SYNOPSIS
    Tự động cấu hình danh sách Exclusion cho Windows Defender để tăng tốc build Rust & Tauri.
.DESCRIPTION
    Script thêm thư mục target, node_modules và Cargo registry cache vào danh sách loại trừ quét của Windows Defender,
    giúp loại bỏ hiện tượng nghẽn cổ chai I/O khi cargo sinh ra hàng ngàn tệp .rlib và .pdb tạm thời.
#>
[CmdletBinding()]
param(
    [string]$ProjectDir = (Resolve-Path "$PSScriptRoot\..\..\..").Path
)

$targetPath = Join-Path $ProjectDir "software\desktop-app\src-tauri\target"
$nodeModulesPath = Join-Path $ProjectDir "software\desktop-app\node_modules"
$cargoPath = Join-Path $env:USERPROFILE ".cargo"

$pathsToAdd = @($targetPath, $nodeModulesPath, $cargoPath)

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  TouchPass - Windows Defender Exclusion Setup" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

if (-not $isAdmin) {
    Write-Warning "Yêu cầu quyền Administrator để tự động thêm Exclusion vào Windows Defender."
    Write-Host "`nCách 1 (Tự động): Mở PowerShell bằng 'Run as Administrator' và chạy lệnh sau:" -ForegroundColor Yellow
    Write-Host "  powershell -ExecutionPolicy Bypass -File `"$PSCommandPath`"`n" -ForegroundColor White
    Write-Host "Cách 2 (Thủ công):" -ForegroundColor Yellow
    Write-Host "  1. Mở Windows Security -> Virus & threat protection -> Manage settings" -ForegroundColor Gray
    Write-Host "  2. Cuộn xuống mục Exclusions -> chọn 'Add or remove exclusions'" -ForegroundColor Gray
    Write-Host "  3. Chọn Add an exclusion -> Folder, và thêm các đường dẫn sau:" -ForegroundColor Gray
    $pathsToAdd | ForEach-Object { Write-Host "     - $_" -ForegroundColor Green }
    Write-Host "`n"
    exit 0
}

Write-Host "`nĐang thêm các đường dẫn vào Windows Defender Exclusion..." -ForegroundColor Cyan
foreach ($path in $pathsToAdd) {
    try {
        Add-MpPreference -ExclusionPath $path -ErrorAction Stop
        Write-Host "[OK] Đã thêm thành công: $path" -ForegroundColor Green
    } catch {
        Write-Warning "Không thể thêm $path : $_"
    }
}

Write-Host "`nHoàn tất! Quá trình build Rust + Tauri sẽ không bị Antivirus làm chậm." -ForegroundColor Green
