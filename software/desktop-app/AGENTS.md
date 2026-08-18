# Antigravity Rules for TouchPass Desktop App

Khi phát triển, kiểm thử, hoặc biên dịch dự án Tauri Desktop:

1. **Package Manager**: Luôn ưu tiên sử dụng `pnpm` thay vì `npm` (ví dụ: `pnpm install`, `pnpm run check`, `pnpm test`, `pnpm run test:gate`, `pnpm run tauri:dev`).
2. **Build Speed**: Đảm bảo `.cargo/config.toml` luôn duy trì cấu hình `rustflags = ["-C", "link-arg=-fuse-ld=lld"]` để đảm bảo tốc độ linking tăng dần < 10 giây.
3. **Disk Management**:
   - Khi dọn dẹp thường xuyên, chạy `pnpm run clean` (hoặc `scripts/clean-workspace.ps1 -Days 7`) để giữ lại cache nóng.
   - Khi cần dọn dẹp triệt để trước khi đóng gói hoặc giải phóng đĩa, chạy `pnpm run clean:full`.
4. **Skill kích hoạt**: Sử dụng skill `cm-tauri-optimize` khi thực hiện các tác vụ liên quan đến tối ưu hóa hiệu năng, dọn dẹp cache hoặc cấu hình Windows Defender.
