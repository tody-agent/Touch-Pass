# TouchPass Extended Shortcut Presets Library Design Specification

## Overview
TouchPass enables hardware biometric fingerprints to trigger instant keyboard automation. This specification expands the preset and template library with a comprehensive catalog of shortcuts and macros tailored for:
1. **AI Agent Permission Approvals & Control**: Approving (`y`), Rejecting (`n`), Selecting Options (`1`), Interrupting (`Ctrl+C`), and Granting Permissions.
2. **AI Assistant Task & Mode Switching**: Switching between Chat, Code, and Cowork modes, opening new tasks/chats, searching projects, and compacting context across **Claude Code**, **Claude Desktop**, **OpenAI Codex / ChatGPT Work**, and **Google Antigravity (CLI & Desktop)**.
3. **OS Window Switching & App Management**: Effortlessly cycling and switching between windows and workspaces on **Windows** and **macOS**.
4. **Terminal & Developer Automation**: Git operations, Docker status, screen clearing, and CLI lifecycle.
5. **Productivity & Browser Navigation**: Tab switching, devtools, and quick logging.

---

## 1. Architecture & Integration Points

### 1.1 Data Structure (`shortcutPresets.ts`)
A dedicated module `software/desktop-app/src/lib/shortcutPresets.ts` defines all templates, categories, and helpers:

```typescript
export type PresetCategory = 'ai_approve' | 'ai_task' | 'os_switch' | 'dev' | 'productivity';
export type PresetOS = 'all' | 'windows' | 'macos';

export interface ShortcutTemplate {
  id: string;
  category: PresetCategory;
  os?: PresetOS;
  icon: string; // Lucide icon name identifier
  labelKey: string;
  descKey: string;
  payload: string;
  badge: string;
}
```

### 1.2 Catalog of Preset Templates

#### Category 1: Duyệt, Từ chối & Cấp quyền AI (`ai_approve`)
- `ai_approve_yes`: **Duyệt lệnh / Đồng ý (Approve)** — Gửi `y` + Enter phê duyệt chạy lệnh shell/sửa code (`y`) — badge `y + ↵`
- `ai_approve_option_1`: **Chọn mục 1 (Proceed #1)** — Chọn phương án 1 trong menu lựa chọn CLI (`1`) — badge `1 + ↵`
- `ai_reject_no`: **Từ chối / Bỏ qua (Reject)** — Gửi `n` + Enter từ chối đề xuất (`n`) — badge `n + ↵`
- `ai_cancel_interrupt`: **Hủy / Dừng khẩn cấp (Interrupt)** — Ngắt tiến trình AI đang sinh code (`Ctrl+C` text/signal) — badge `Ctrl + C`
- `ai_grant_permissions`: **Cấp toàn quyền (Grant All)** — Gửi lệnh cấp quyền bỏ qua nhắc nhở (`/allow`) — badge `/allow`

#### Category 2: Quản lý Tasks & Chuyển chế độ AI (`ai_task`)
*Dành riêng cho Claude Code, Claude Desktop (Code/Chat/Cowork), OpenAI Codex/ChatGPT, và Antigravity CLI/Desktop:*
- `claude_new_task`: **Claude: Tạo Task mới** — Mở hội thoại/task mới (`Ctrl/Cmd+Shift+O`) — badge `Ctrl+Shift+O`
- `claude_switch_mode`: **Claude: Đổi Chat / Code / Cowork** — Chuyển đổi giữa các chế độ (`Ctrl/Cmd+Shift+C`) — badge `Ctrl+Shift+C`
- `claude_find_task`: **Claude: Chuyển đổi Task & Dự án** — Mở thanh điều hướng nhanh (`Ctrl/Cmd+K`) — badge `Ctrl/Cmd+K`
- `claude_compact`: **Claude Code: Nén ngữ cảnh** — Thu gọn token ngữ cảnh (`/compact`) — badge `/compact`
- `claude_cost`: **Claude Code: Xem chi phí token** — Kiểm tra mức tiêu thụ token (`/cost`) — badge `/cost`
- `claude_clear`: **Claude Code: Làm mới phiên** — Reset bộ nhớ hội thoại (`/clear`) — badge `/clear`
- `codex_new_chat`: **Codex / ChatGPT: Mở Chat/Task mới** — Tạo phiên làm việc mới (`Ctrl/Cmd+N`) — badge `Ctrl+N`
- `codex_toggle_sidebar`: **Codex / ChatGPT: Danh sách Tasks** — Đóng/mở sidebar lịch sử (`Ctrl/Cmd+Shift+S`) — badge `Ctrl+Shift+S`
- `antigravity_plan`: **Antigravity: Chế độ Lập kế hoạch** — Chuyển sang `/plan` workflow — badge `/plan`
- `antigravity_grill`: **Antigravity: Phỏng vấn làm rõ (Grill Me)** — Khởi chạy `/grill-me` — badge `/grill-me`
- `antigravity_schedule`: **Antigravity: Lên lịch tác vụ ngầm** — Thiết lập `/schedule` — badge `/schedule`

#### Category 3: Chuyển đổi Cửa sổ & Quản lý OS (`os_switch`)
- `win_switch_window`: **Windows: Đổi cửa sổ (Alt + Tab)** — Chuyển qua lại giữa các ứng dụng — badge `Alt + Tab`
- `win_task_view`: **Windows: Task View** — Xem tổng quan tất cả màn hình ảo (`Win + Tab`) — badge `Win + Tab`
- `win_show_desktop`: **Windows: Ẩn/Hiện Desktop** — Thu nhỏ tất cả cửa sổ (`Win + D`) — badge `Win + D`
- `win_clipboard_history`: **Windows: Lịch sử Clipboard** — Mở khay nhớ tạm đa năng (`Win + V`) — badge `Win + V`
- `mac_switch_app`: **macOS: Đổi ứng dụng (Cmd + Tab)** — Chuyển qua lại app đang mở — badge `Cmd + Tab`
- `mac_spotlight`: **macOS: Tìm kiếm Spotlight** — Mở thanh tìm kiếm hệ thống (`Cmd + Space`) — badge `Cmd + Space`
- `mac_mission_control`: **macOS: Mission Control** — Quản lý cửa sổ đang mở (`Ctrl + Up`) — badge `Ctrl + ↑`

#### Category 4: Terminal & Developer Tools (`dev`)
- `git_status`: **Git Status** — Kiểm tra trạng thái thay đổi (`git status`) — badge `git status`
- `git_commit_quick`: **Git Commit** — Soạn commit nhanh (`git commit -v`) — badge `git commit`
- `git_diff`: **Git Diff** — Xem khác biệt mã nguồn (`git diff`) — badge `git diff`
- `terminal_clear`: **Xóa màn hình Terminal** — Xóa sạch console (`clear`) — badge `clear`
- `docker_ps`: **Docker Containers** — Xem danh sách container chạy ngầm (`docker ps`) — badge `docker ps`
- `cli_exit`: **Thoát an toàn** — Rời khỏi session (`exit`) — badge `exit`

#### Category 5: Tiện ích & Trình duyệt (`productivity`)
- `browser_reopen_tab`: **Mở lại Tab vừa đóng** — Khôi phục tab duyệt web (`Ctrl/Cmd+Shift+T`) — badge `Shift+T`
- `browser_close_tab`: **Đóng Tab hiện tại** — Đóng tab đang mở (`Ctrl/Cmd+W`) — badge `Ctrl+W`
- `browser_devtools`: **Mở F12 DevTools** — Bật công cụ kiểm tra web (`F12`) — badge `F12`
- `quick_paste_log`: **In log kiểm thử** — Gõ nhanh câu lệnh debug (`console.log()`) — badge `log()`

---

## 2. UI / UX Design in `ActionPane.svelte`

1. **Preset Library Selector Layout**:
   - Khi người dùng chọn **"Phím tắt tùy chọn" (Custom Shortcut)**, bên dưới ô nhập chuỗi phím tắt sẽ hiển thị hộp **"Thư viện phím tắt gợi ý" (TouchPass Preset Library)**.
   - **Thanh Filter Tabs**:
     - `Tất cả` (All)
     - `✅ Duyệt & Cấp quyền AI` (ai_approve)
     - `🤖 Tasks & Chế độ AI` (ai_task)
     - `🪟 Đổi cửa sổ & OS` (os_switch)
     - `💻 Terminal & Dev` (dev)
     - `⚡ Tiện ích` (productivity)
   - **Thẻ mẫu tương tác (Quick-Pick Cards)**:
     - Hiển thị theo lưới dạng 2 cột (hoặc cuộn mượt mà), có Icon chủ đề, Tiêu đề nổi bật, Phím tắt badge và Mô tả ngắn.
     - **Thao tác 1-Click**: Khi click vào bất kỳ thẻ mẫu nào, `customPayload` được tự động điền ngay lập tức, kích hoạt trạng thái dirty và highlight thẻ vừa chọn.
     - Người dùng có thể tiếp tục tinh chỉnh chuỗi phím tắt trong ô input nếu muốn.

2. **Tự động nhận diện OS (OS-Aware)**:
   - Tự động ưu tiên hiển thị phím tắt Windows khi chạy trên Windows và macOS khi chạy trên macOS.

---

## 3. Localization (`i18n.ts`)
Bổ sung đầy đủ chuỗi dịch cho tất cả danh mục, tiêu đề và mô tả của từng phím tắt mẫu trên 3 ngôn ngữ:
- **Tiếng Việt (`vi`)**
- **English (`en`)**
- **简体中文 (`zh-CN`)**

---

## 4. Verification & Testing Strategy
- Unit tests trong `shortcutPresets.test.ts` đảm bảo 100% template có ID duy nhất, payload ASCII hợp lệ (1-128 bytes), và đúng category/OS.
- Kiểm tra Vitest & Svelte Check toàn diện.
- Build và đóng gói thử nghiệm trên desktop app.
