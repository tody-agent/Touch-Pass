<#
.SYNOPSIS
    Dọn dẹp không gian đĩa thông minh cho TouchPass (Rust + Tauri + Svelte).
.DESCRIPTION
    Giải phóng hàng gigabyte dung lượng ổ cứng bị chiếm dụng bởi các tệp build incremental cũ,
    tệp cache Cargo và node_modules mà vẫn giữ lại cache hiện tại để lần build tiếp theo nhanh nhất.
.PARAMETER Days
    Số ngày lưu trữ tệp build cũ (mặc định: 7 ngày).
.PARAMETER FullClean
    Xóa toàn bộ thư mục target và node_modules để build lại từ đầu.
.PARAMETER CleanCargoRegistry
    Dọn dẹp registry cache trong ~/.cargo.
#>
[CmdletBinding()]
param(
    [int]$Days = 7,
    [switch]$FullClean,
    [switch]$CleanCargoRegistry
)

$repoRoot = (Resolve-Path "$PSScriptRoot\..\..\..").Path
$targetDir = Join-Path $repoRoot "software\desktop-app\src-tauri\target"
$nodeModulesDir = Join-Path $repoRoot "software\desktop-app\node_modules"

function Get-DirSizeMB($path) {
    if (Test-Path $path) {
        $measure = Get-ChildItem -Path $path -Recurse -File -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum
        if ($measure -and $measure.Sum) {
            return [math]::Round($measure.Sum / 1MB, 2)
        }
    }
    return 0
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  TouchPass - Workspace Disk Space Cleanup" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$initialTargetSize = Get-DirSizeMB $targetDir
$initialNodeSize = Get-DirSizeMB $nodeModulesDir
Write-Host "Dung lượng hiện tại:" -ForegroundColor Yellow
Write-Host "  - Target:       $initialTargetSize MB" -ForegroundColor White
Write-Host "  - Node Modules: $initialNodeSize MB" -ForegroundColor White
Write-Host "  - Tổng cộng:    $([math]::Round($initialTargetSize + $initialNodeSize, 2)) MB`n" -ForegroundColor White

if ($FullClean) {
    Write-Host "[Chế độ Deep Clean] Đang xóa toàn bộ target/ và node_modules..." -ForegroundColor Magenta
    if (Test-Path $targetDir) {
        Remove-Item -Path $targetDir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  [x] Đã xóa: $targetDir" -ForegroundColor Green
    }
    if (Test-Path $nodeModulesDir) {
        Remove-Item -Path $nodeModulesDir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  [x] Đã xóa: $nodeModulesDir" -ForegroundColor Green
    }
} else {
    Write-Host "[Chế độ Smart Clean] Đang dọn dẹp các tệp build incremental cũ hơn $Days ngày..." -ForegroundColor Cyan
    
    # 1. Dọn dẹp incremental build artifacts cũ
    $cutoff = (Get-Date).AddDays(-$Days)
    $incrementalDir = Join-Path $targetDir "debug\incremental"
    if (Test-Path $incrementalDir) {
        $oldDirs = Get-ChildItem -Path $incrementalDir -Directory -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -lt $cutoff }
        foreach ($d in $oldDirs) {
            Remove-Item -Path $d.FullName -Recurse -Force -ErrorAction SilentlyContinue
        }
        Write-Host "  [+] Đã dọn dẹp incremental build cache cũ." -ForegroundColor Green
    }
    
    # 2. Sử dụng cargo-sweep nếu đã cài đặt
    if (Get-Command "cargo-sweep" -ErrorAction SilentlyContinue) {
        Write-Host "  [+] Chạy cargo-sweep..." -ForegroundColor Cyan
        Push-Location (Join-Path $repoRoot "software\desktop-app\src-tauri")
        cargo sweep --time $Days
        Pop-Location
    }
}

# 3. Dọn dẹp Cargo Registry Cache nếu yêu cầu
if ($CleanCargoRegistry) {
    Write-Host "`nĐang dọn dẹp ~/.cargo cache..." -ForegroundColor Cyan
    if (Get-Command "cargo-cache" -ErrorAction SilentlyContinue) {
        cargo-cache --autoclean
    } else {
        $cargoRegistry = Join-Path $env:USERPROFILE ".cargo\registry\cache"
        if (Test-Path $cargoRegistry) {
            Get-ChildItem -Path $cargoRegistry -File -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
            Write-Host "  [+] Đã dọn sạch .cargo\registry\cache" -ForegroundColor Green
        }
    }
}

$finalTargetSize = Get-DirSizeMB $targetDir
$finalNodeSize = Get-DirSizeMB $nodeModulesDir
$freedMB = [math]::Round(($initialTargetSize + $initialNodeSize) - ($finalTargetSize + $finalNodeSize), 2)

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host "  KẾT QUẢ DỌN DẸP DUNG LƯỢNG" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  - Target:       $finalTargetSize MB (Giảm $([math]::Round($initialTargetSize - $finalTargetSize, 2)) MB)" -ForegroundColor White
Write-Host "  - Node Modules: $finalNodeSize MB (Giảm $([math]::Round($initialNodeSize - $finalNodeSize, 2)) MB)" -ForegroundColor White
Write-Host "  - Đã giải phóng: $freedMB MB ($([math]::Round($freedMB / 1024, 2)) GB)" -ForegroundColor Green
Write-Host "============================================================`n" -ForegroundColor Green
