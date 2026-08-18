---
name: cm-tauri-optimize
description: Tự động hóa kiểm tra hiệu năng build, dọn dẹp dung lượng đĩa target/node_modules và tối ưu hóa môi trường phát triển Tauri & Rust trên Windows.
version: 1.0.0
platforms:
  - windows
---

# Tauri & Rust Build Performance and Disk Optimization Skill

Skill này cung cấp quy trình chuẩn hóa để tự động dọn dẹp dung lượng đĩa (`target/`, `node_modules/`, `.cargo/registry`), tăng tốc thời gian linking Rust lên đến 30x–40x và loại bỏ tắc nghẽn I/O từ Windows Defender cho các ứng dụng Tauri v2 trên Windows.

---

## 1. Kiểm tra Nhanh Dung Lượng và Tình Trạng Workspace

Chạy lệnh PowerShell sau để đo lường dung lượng hiện tại:

```powershell
powershell -ExecutionPolicy Bypass -File software/desktop-app/scripts/clean-workspace.ps1 -Days 30
```

---

## 2. Quy Trình Dọn Dẹp Tự Động (Workflows)

### Workflow A: Dọn dẹp An Toàn (Smart Sweep - Định kỳ hàng tuần)
Giải phóng các tệp cache và incremental build cũ hơn 7 ngày mà **không làm mất cache hiện tại** (đảm bảo lần build tiếp theo chỉ mất ~7 giây):

```powershell
# Chạy trực tiếp qua PowerShell
powershell -ExecutionPolicy Bypass -File software/desktop-app/scripts/clean-workspace.ps1 -Days 7

# Hoặc qua pnpm
cd software/desktop-app
pnpm run clean
```

### Workflow B: Dọn dẹp Sâu Toàn Diện (Deep / Full Clean)
Xóa sạch `target/` và `node_modules/` để thu hồi toàn bộ nhiều GB dung lượng đĩa khi kết thúc sprint hoặc cần kiểm tra cold build:

```powershell
# Chạy trực tiếp qua PowerShell
powershell -ExecutionPolicy Bypass -File software/desktop-app/scripts/clean-workspace.ps1 -FullClean

# Hoặc qua pnpm
cd software/desktop-app
pnpm run clean:full
```

### Workflow C: Dọn dẹp Cargo Registry Cache (~/.cargo)
Giải phóng các bản nén crate cũ không còn dùng trong `%USERPROFILE%\.cargo`:

```powershell
powershell -ExecutionPolicy Bypass -File software/desktop-app/scripts/clean-workspace.ps1 -Days 7 -CleanCargoRegistry
```

---

## 3. Tối Ưu Tốc Độ Build Hàng Ngày

Khi phát triển hoặc kiểm thử:
1. **Dùng LLD Linker:** Đảm bảo `.cargo/config.toml` chứa `rustflags = ["-C", "link-arg=-fuse-ld=lld"]`.
2. **Dùng pnpm:** Luôn sử dụng `pnpm install` và `pnpm run test:gate` thay vì npm.
3. **Loại trừ Antivirus:** Chạy `powershell -ExecutionPolicy Bypass -File software/desktop-app/scripts/add-defender-exclusion.ps1` một lần dưới quyền Administrator.

---

## 4. Tự Động Hóa Định Kỳ trên Windows (Task Scheduler)

Để Windows tự động dọn dẹp hàng tuần mà không cần thao tác tay:

```powershell
# Đăng ký tác vụ chạy tự động vào 12:00 Chủ Nhật hàng tuần
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File `"$PWD\software\desktop-app\scripts\clean-workspace.ps1`" -Days 7"
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 12:00pm
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "TouchPass-Workspace-Cleaner" -Description "Tự động dọn dẹp target/ TouchPass"
```
