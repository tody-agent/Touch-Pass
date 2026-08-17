# Kế hoạch Tối ưu Tốc độ Build & Tiết kiệm Dung lượng (Rust + Tauri trên Windows)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tối ưu hóa toàn diện tốc độ biên dịch (giảm thời gian linking từ vài phút xuống dưới 20s) và giải phóng hàng gigabyte dung lượng ổ cứng (từ ~7.7 GB target/node_modules xuống mức kiểm soát được) cho ứng dụng TouchPass Desktop (Rust + Tauri v2 + Svelte 5).

**Architecture:** 
1. **Build Speed Acceleration:** Tích hợp LLD Linker (`lld-link`) qua `.cargo/config.toml`, tinh chỉnh dev profile (`opt-level=0`, `debug=1`, tối ưu hóa dependencies) và hỗ trợ caching với `sccache`.
2. **Disk Space Optimization:** Chuyển đổi bộ quản lý gói Frontend sang `pnpm` (cơ chế Content-Addressable Storage hard-links), tích hợp công cụ dọn dẹp `cargo-sweep` và `cargo-cache`.
3. **Automation & Developer Tooling:** Xây dựng bộ script PowerShell chuyên dụng để tự động dọn dẹp `target/` theo độ tuổi tệp và thiết lập nhanh Windows Defender Exclusion nhằm loại trừ nghẽn cổ chai I/O.

**Tech Stack:** Rust 1.96 / Tauri v2.8 / Cargo / LLD / sccache / pnpm 10 / Svelte 5 / PowerShell

## Global Constraints
- Tất cả các lệnh build và test (`cargo test`, `pnpm test`, `npm run test:gate`) phải tiếp tục hoạt động chính xác 100% không phát sinh lỗi.
- Đảm bảo tương thích hoàn toàn trên Windows 11/10 với kiến trúc MSVC (`x86_64-pc-windows-msvc`).
- Cấu hình Cargo và script dọn dẹp không làm ảnh hưởng đến mã nguồn logic nghiệp vụ hay các file mã hóa/HMAC/Smartcard.

---

### Task 1: Cấu hình Tối ưu Hóa Biên Dịch Rust & LLD Linker

**Files:**
- Create: `software/desktop-app/src-tauri/.cargo/config.toml`
- Modify: `software/desktop-app/src-tauri/Cargo.toml`
- Test: `software/desktop-app/src-tauri/tests` / `cargo check`

**Interfaces:**
- Consumes: Toolchain Rust MSVC và Tauri v2 dependencies
- Produces: File cấu hình `.cargo/config.toml` và profiles `[profile.dev]`, `[profile.dev.package."*"]`, `[profile.release]` tối ưu trong `Cargo.toml`.

- [ ] **Step 1: Cập nhật `Cargo.toml` với dev & release profiles tối ưu**

```toml
[profile.dev]
opt-level = 0
debug = 1
incremental = true

[profile.dev.package."*"]
opt-level = 2

[profile.release]
opt-level = 3
lto = "thin"
codegen-units = 1
strip = true
```

- [ ] **Step 2: Cập nhật `.cargo/config.toml` sử dụng LLD linker và cấu hình rustc wrapper**

```toml
[target.x86_64-pc-windows-msvc]
rustflags = ["-C", "link-arg=-fuse-ld=lld"]

# Hỗ trợ sccache nếu người dùng đã cài đặt sccache
# [build]
# rustc-wrapper = "sccache"
```

- [ ] **Step 3: Kiểm tra biên dịch và đo lường thời gian build**

Run: `cargo test --no-run` trong `software/desktop-app/src-tauri`
Expected: Biên dịch thành công với `rust-lld` nhanh hơn đáng kể.

---

### Task 2: Chuyển đổi Quản lý Gói Frontend sang pnpm để Tiết kiệm Dung lượng

**Files:**
- Modify: `software/desktop-app/package.json`
- Create: `software/desktop-app/pnpm-lock.yaml`
- Test: `software/desktop-app` (check, test, build)

**Interfaces:**
- Consumes: pnpm CLI (phiên bản 10.x đã có sẵn trên máy)
- Produces: `pnpm-lock.yaml`, cấu hình scripts hỗ trợ cả npm và pnpm linh hoạt.

- [ ] **Step 1: Cập nhật `package.json` để chuẩn hóa các lệnh test & build**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview --host 127.0.0.1",
    "check": "svelte-check --tsconfig ./tsconfig.json --config ./vite.config.ts --fail-on-warnings",
    "test": "vitest run",
    "test:gate": "pnpm run check && pnpm test && pnpm run build",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

- [ ] **Step 2: Khởi tạo pnpm store và cài đặt dependencies**

Run: `pnpm install` trong `software/desktop-app`
Expected: Tạo thành công `pnpm-lock.yaml` và node_modules dạng symlink/hardlink tiết kiệm dung lượng.

- [ ] **Step 3: Chạy toàn bộ bộ test frontend**

Run: `pnpm run test:gate` trong `software/desktop-app`
Expected: `svelte-check`, `vitest`, và `vite build` đều PASS.

---

### Task 3: Tạo Script Tự Động Thiết Lập Windows Defender Exclusion

**Files:**
- Create: `software/desktop-app/scripts/add-defender-exclusion.ps1`

**Interfaces:**
- Consumes: Quyền Admin Windows PowerShell (hoặc hướng dẫn người dùng qua UI)
- Produces: Danh sách Exclusion Path cho `target/`, `node_modules/`, `%USERPROFILE%\.cargo`

- [ ] **Step 1: Viết script `add-defender-exclusion.ps1`**

```powershell
<#
.SYNOPSIS
    Tự động thêm thư mục dự án và Cargo cache vào Windows Defender Exclusion.
#>
param(
    [string]$ProjectDir = (Resolve-Path "$PSScriptRoot\..\..\..").Path
)

$targetPath = Join-Path $ProjectDir "software\desktop-app\src-tauri\target"
$nodeModulesPath = Join-Path $ProjectDir "software\desktop-app\node_modules"
$cargoPath = Join-Path $env:USERPROFILE ".cargo"

$pathsToAdd = @($targetPath, $nodeModulesPath, $cargoPath)

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Warning "Vui lòng chạy PowerShell dưới quyền Administrator (Run as Administrator) để cấu hình Defender Exclusion tự động."
    Write-Host "`nHoặc bạn có thể thêm thủ công qua Windows Security:" -ForegroundColor Cyan
    $pathsToAdd | ForEach-Object { Write-Host " - $_" -ForegroundColor Yellow }
    exit 1
}

Write-Host "Đang thêm các đường dẫn vào Windows Defender Exclusion..." -ForegroundColor Cyan
foreach ($path in $pathsToAdd) {
    if (Test-Path $path) {
        Add-MpPreference -ExclusionPath $path -ErrorAction SilentlyContinue
        Write-Host "[OK] Đã loại trừ: $path" -ForegroundColor Green
    } else {
        Add-MpPreference -ExclusionPath $path -ErrorAction SilentlyContinue
        Write-Host "[OK] Đã đăng ký loại trừ trước: $path" -ForegroundColor Gray
    }
}
Write-Host "`nHoàn tất tối ưu hóa I/O Windows Defender!" -ForegroundColor Green
```

- [ ] **Step 2: Kiểm tra cú pháp script**

Run: `powershell -ExecutionPolicy Bypass -File software/desktop-app/scripts/add-defender-exclusion.ps1`
Expected: In ra hướng dẫn rõ ràng hoặc thực thi thành công nếu có quyền Admin.

---

### Task 4: Xây dựng Script Dọn Dẹp Không Gian Ổ Cứng Tự Động (`clean-workspace.ps1`)

**Files:**
- Create: `software/desktop-app/scripts/clean-workspace.ps1`

**Interfaces:**
- Consumes: Cấu trúc thư mục `target/`, `node_modules/`, `cargo-sweep`, `cargo-cache` (nếu có)
- Produces: Giải phóng bộ nhớ đệm cũ, thống kê dung lượng giải phóng chi tiết theo MB/GB.

- [ ] **Step 1: Viết script `clean-workspace.ps1` hỗ trợ 3 chế độ (Smart Sweep, Deep Clean, Cache Clean)**

```powershell
<#
.SYNOPSIS
    Dọn dẹp không gian đĩa thông minh cho TouchPass (Rust + Tauri + Svelte).
.PARAMETER Days
    Số ngày lưu trữ tệp build cũ (mặc định: 7 ngày).
.PARAMETER FullClean
    Xóa toàn bộ thư mục target và node_modules để build lại từ đầu.
.PARAMETER CleanCargoRegistry
    Dọn dẹp registry cache trong ~/.cargo.
#>
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

Write-Host "=== BẮT ĐẦU DỌN DẸP DUNG LƯỢNG WORKSPACE ===" -ForegroundColor Cyan
$initialTargetSize = Get-DirSizeMB $targetDir
$initialNodeSize = Get-DirSizeMB $nodeModulesDir
Write-Host "Dung lượng hiện tại -> Target: $initialTargetSize MB | Node Modules: $initialNodeSize MB" -ForegroundColor Yellow

if ($FullClean) {
    Write-Host "[Chế độ Deep Clean] Xóa toàn bộ target/ và node_modules..." -ForegroundColor Magenta
    if (Test-Path $targetDir) { Remove-Item -Path $targetDir -Recurse -Force -ErrorAction SilentlyContinue }
    if (Test-Path $nodeModulesDir) { Remove-Item -Path $nodeModulesDir -Recurse -Force -ErrorAction SilentlyContinue }
} else {
    Write-Host "[Chế độ Smart Clean] Đang dọn dẹp các tệp build incremental cũ hơn $Days ngày..." -ForegroundColor Cyan
    
    # Dọn dẹp incremental build cache cũ
    $cutoff = (Get-Date).AddDays(-$Days)
    $incrementalDir = Join-Path $targetDir "debug\incremental"
    if (Test-Path $incrementalDir) {
        Get-ChildItem -Path $incrementalDir -Directory -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -lt $cutoff } | ForEach-Object {
            Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
    
    # Nếu có cargo-sweep thì sử dụng
    if (Get-Command "cargo-sweep" -ErrorAction SilentlyContinue) {
        Push-Location (Join-Path $repoRoot "software\desktop-app\src-tauri")
        cargo sweep --time $Days
        Pop-Location
    }
}

if ($CleanCargoRegistry) {
    if (Get-Command "cargo-cache" -ErrorAction SilentlyContinue) {
        Write-Host "Đang dọn dẹp ~/.cargo cache bằng cargo-cache..." -ForegroundColor Cyan
        cargo-cache --autoclean
    } else {
        $cargoRegistry = Join-Path $env:USERPROFILE ".cargo\registry\cache"
        if (Test-Path $cargoRegistry) {
            Write-Host "Dọn dẹp tệp cache nén trong $cargoRegistry..." -ForegroundColor Cyan
            Get-ChildItem -Path $cargoRegistry -File -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
        }
    }
}

$finalTargetSize = Get-DirSizeMB $targetDir
$finalNodeSize = Get-DirSizeMB $nodeModulesDir
$freed = [math]::Round(($initialTargetSize + $initialNodeSize) - ($finalTargetSize + $finalNodeSize), 2)

Write-Host "`n=== KẾT QUẢ DỌN DẸP ===" -ForegroundColor Green
Write-Host "Target: $finalTargetSize MB (Giảm $($initialTargetSize - $finalTargetSize) MB)" -ForegroundColor White
Write-Host "Node Modules: $finalNodeSize MB (Giảm $($initialNodeSize - $finalNodeSize) MB)" -ForegroundColor White
Write-Host "Tổng dung lượng đã giải phóng: $freed MB" -ForegroundColor Green
```

- [ ] **Step 2: Chạy thử nghiệm script ở chế độ an toàn**

Run: `powershell -ExecutionPolicy Bypass -File software/desktop-app/scripts/clean-workspace.ps1 -Days 0`
Expected: Quét và thống kê dung lượng chính xác, không phát sinh lỗi script.

---

### Task 5: Cập nhật Tài liệu & Hướng dẫn Tối ưu Hóa Tốc Độ / Bộ Nhớ

**Files:**
- Modify: `software/desktop-app/README.md`
- Test: Kiểm tra tài liệu hiển thị đầy đủ và các lệnh copy-paste chuẩn xác.

- [ ] **Step 1: Thêm phần hướng dẫn Tối ưu Build Speed & Dung lượng Đĩa vào `software/desktop-app/README.md`**

Nội dung bao gồm:
1. Cách cài đặt `sccache` (`winget install Mozilla.sccache` hoặc `cargo install sccache`).
2. Cách cài đặt `cargo-sweep` & `cargo-cache`.
3. Lệnh chạy `clean-workspace.ps1` định kỳ.
4. Hướng dẫn sử dụng `pnpm` thay thế `npm`.

- [ ] **Step 2: Chạy kiểm thử toàn bộ dự án để chốt hoàn tất**

Run: `cargo test --offline` và `pnpm run test:gate` (hoặc `npm run test:gate`)
Expected: Toàn bộ kiểm thử thành công.

---

## Verification Plan

### Automated Tests
1. **Rust Test Suite:**
   ```powershell
   cd software/desktop-app/src-tauri
   cargo test --offline
   ```
2. **Frontend Test Suite:**
   ```powershell
   cd software/desktop-app
   pnpm run test:gate
   ```
3. **Workspace Cleanup Test:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File software/desktop-app/scripts/clean-workspace.ps1 -Days 7
   ```

### Manual Verification
- Kiểm tra tốc độ biên dịch tăng dần (incremental build) đo lường bằng `Measure-Command { cargo build --lib }` (kỳ vọng < 20 giây so với vài phút trước đây).
- Kiểm tra dung lượng thư mục `target/` và `node_modules/` trước và sau khi dọn dẹp.
