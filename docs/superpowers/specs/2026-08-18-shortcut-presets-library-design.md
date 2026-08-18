# TouchPass Unified Categorized Action & Presets Library Design Specification

## Overview
TouchPass enables hardware biometric fingerprints to trigger instant keyboard automation. This specification defines a clean, unified, categorized action picker in `ActionPane.svelte` (Option A: Direct categorized action list in a single clean view) that gives users immediate 1-click access to presets for:
1. **AI Agent Interactive Approvals & Commands**: Approving (`y`), Rejecting (`n`), Compacting context (`/compact`), Antigravity planning (`/plan`), and Task switching.
2. **AI Assistant Task & Mode Switching**: Switching between Chat, Code, and Cowork modes, opening new tasks/chats across **Claude Code**, **Claude Desktop**, **OpenAI Codex / ChatGPT**, and **Google Antigravity**.
3. **OS Window Switching & App Management**: Cycling windows and workspaces on **Windows** (`Alt+Tab`, `Win+Tab`, `Win+D`, `Win+V`) and **macOS** (`Cmd+Tab`, `Cmd+Space`, `Ctrl+↑`).
4. **Terminal & Developer Automation**: Git operations, Docker status, screen clearing, and CLI lifecycle.
5. **Security & Basic Keys**: OS Keyring password typing, Enter, Escape, and custom user-defined shortcuts.

---

## 1. Architecture & Data Model

### 1.1 Action Definition Module (`shortcutPresets.ts`)
A dedicated module `software/desktop-app/src/lib/shortcutPresets.ts` defines all categorized actions and preset templates:

```typescript
import type { ActionType } from './types';

export type ActionCategory = 'ai_agent' | 'os_window' | 'developer' | 'basic_security';
export type PresetOS = 'all' | 'windows' | 'macos';

export interface ActionOptionItem {
  id: string;
  category: ActionCategory;
  os?: PresetOS;
  actionType: ActionType;
  payload?: string;
  labelKey: string;
  descKey: string;
  badge?: string;
  iconName: string;
  accentColor: string;
  isExpandable?: boolean; // true for 'password' and 'custom'
}
```

### 1.2 Catalog of Categorized Action Items

#### Group 1: 🤖 Trợ lý AI (Claude, Codex, ChatGPT, Antigravity) — `ai_agent`
- `ai_accept`: **Claude / Codex: Phê duyệt chạy lệnh** — `y + Enter` (actionType: `ai_accept`, badge: `y + ↵`)
- `ai_reject`: **Claude / Codex: Từ chối chạy lệnh** — `n + Enter` (actionType: `custom`, payload: `n`, badge: `n + ↵`)
- `claude_switch_mode`: **Claude: Đổi Chat / Code / Cowork** — Chuyển chế độ làm việc (actionType: `custom`, payload: `Ctrl+Shift+C`, badge: `Ctrl+Shift+C`)
- `claude_new_task`: **Claude: Tạo hội thoại / Task mới** — Mở task mới (actionType: `custom`, payload: `Ctrl+Shift+O`, badge: `Ctrl+Shift+O`)
- `codex_new_chat`: **Codex / ChatGPT: Mở Chat/Task mới** — Tạo phiên làm việc mới (actionType: `custom`, payload: `Ctrl+N`, badge: `Ctrl+N`)
- `antigravity_plan`: **Antigravity: Chế độ Lập kế hoạch** — Chuyển sang `/plan` (actionType: `custom`, payload: `/plan`, badge: `/plan`)
- `antigravity_grill`: **Antigravity: Phỏng vấn làm rõ (Grill Me)** — Khởi chạy `/grill-me` (actionType: `custom`, payload: `/grill-me`, badge: `/grill-me`)
- `claude_compact`: **Claude Code: Nén ngữ cảnh** — Thu gọn token (`/compact`) (actionType: `custom`, payload: `/compact`, badge: `/compact`)

#### Group 2: 🪟 Chuyển cửa sổ & Quản lý OS (Windows / macOS) — `os_window`
*Tự động lọc thông minh theo OS của máy tính người dùng:*
- **Windows**:
  - `win_switch_window`: **Windows: Đổi qua lại các cửa sổ** — `Alt + Tab` (actionType: `custom`, payload: `Alt+Tab`, badge: `Alt + Tab`)
  - `win_task_view`: **Windows: Tổng quan Task View** — `Win + Tab` (actionType: `custom`, payload: `Win+Tab`, badge: `Win + Tab`)
  - `win_show_desktop`: **Windows: Ẩn / Hiện Desktop** — `Win + D` (actionType: `custom`, payload: `Win+D`, badge: `Win + D`)
  - `win_clipboard_history`: **Windows: Lịch sử Clipboard** — `Win + V` (actionType: `custom`, payload: `Win+V`, badge: `Win + V`)
- **macOS**:
  - `mac_switch_app`: **macOS: Đổi ứng dụng qua lại** — `Cmd + Tab` (actionType: `custom`, payload: `Cmd+Tab`, badge: `Cmd + Tab`)
  - `mac_spotlight`: **macOS: Tìm kiếm Spotlight** — `Cmd + Space` (actionType: `custom`, payload: `Cmd+Space`, badge: `Cmd + Space`)
  - `mac_mission_control`: **macOS: Mission Control** — `Ctrl + ↑` (actionType: `custom`, payload: `Ctrl+Up`, badge: `Ctrl + ↑`)

#### Group 3: 💻 Terminal & Lập trình — `developer`
- `git_status`: **Git Status** — `git status` (actionType: `custom`, payload: `git status`, badge: `git status`)
- `git_diff`: **Git Diff** — `git diff` (actionType: `custom`, payload: `git diff`, badge: `git diff`)
- `terminal_clear`: **Xóa màn hình Terminal** — `clear` (actionType: `custom`, payload: `clear`, badge: `clear`)
- `docker_ps`: **Docker Containers** — `docker ps` (actionType: `custom`, payload: `docker ps`, badge: `docker ps`)

#### Group 4: 🔒 Bảo mật & Phím cơ bản — `basic_security`
- `password`: **Điền mật khẩu máy tính (OS Keyring)** — (actionType: `password`, isExpandable: `true`)
- `enter`: **Phím Enter** — (actionType: `enter`, badge: `Enter`)
- `escape`: **Phím Escape** — (actionType: `escape`, badge: `Escape`)
- `custom_input`: **✨ Tự nhập phím tắt riêng...** — (actionType: `custom`, isExpandable: `true`)

---

## 2. UI / UX Design in `ActionPane.svelte`

1. **Giao diện một danh sách phân nhóm trực quan (Single Grouped List)**:
   - Thân của `ActionPane` được chia thành các nhóm với tiêu đề danh mục rõ ràng (uppercase, muted slate, icon đại diện).
   - Mỗi mục tác vụ là một hàng tương tác (action row) đẹp mắt, có radio button, icon màu nổi bật, tiêu đề, mô tả và badge phím tắt bên phải.
   - Khi click vào bất kỳ hàng nào:
     - Tác vụ được chọn ngay lập tức với viền xanh dương tinh tế.
     - Nếu chọn mục **"Điền mật khẩu"**, khung nhập mật khẩu OS Keyring trượt mở ra mượt mà bên dưới hàng đó.
     - Nếu chọn mục **"Tự nhập phím tắt riêng"**, khung nhập chuỗi phím tắt trượt mở ra mượt mà bên dưới hàng đó.
     - Không có các hộp lồng nhau phức tạp hay bảng cuộn chồng chéo.
2. **Khả năng tiếp cận & Phím điều hướng**:
   - Hỗ trợ phím mũi tên (Arrow Up / Down) để di chuyển giữa các mục.
   - Hỗ trợ phím Enter / Space để chọn.

---

## 3. Localization Support (`i18n.ts`)
Bổ sung đầy đủ nhãn danh mục, tên tác vụ và mô tả cho cả 3 ngôn ngữ:
- **Tiếng Việt (`vi`)**
- **English (`en`)**
- **简体中文 (`zh-CN`)**

---

## 4. Verification & Testing Strategy
- Unit tests trong `shortcutPresets.test.ts` kiểm thử:
  - 100% item có ID duy nhất và payload ASCII hợp lệ (<= 128 bytes).
  - Khả năng lọc danh sách theo hệ điều hành (Windows vs. macOS).
  - Khả năng khớp (matching) chính xác giữa `profile.actionType` / `customPayload` và `selectedActionId`.
- Vitest suite & Svelte check vượt qua 100%.
