# TouchPass Extended Shortcut Presets Library Design Specification

## Overview
TouchPass enables hardware biometric fingerprints to trigger instant keyboard automation. This specification expands the preset and template library with a rich catalog of shortcuts and macros tailored for AI coding assistants (Claude Code, OpenAI Codex, ChatGPT CLI, Cursor, Copilot), Operating System window switching and management (Windows, macOS), Terminal/Developer tools, and Productivity workflows.

---

## 1. Architecture & Integration Points

### 1.1 Data Structure (`shortcutPresets.ts`)
A dedicated module `software/desktop-app/src/lib/shortcutPresets.ts` defines all templates and categories:

```typescript
export type PresetCategory = 'ai' | 'os' | 'dev' | 'productivity';
export type PresetOS = 'all' | 'windows' | 'macos';

export interface ShortcutTemplate {
  id: string;
  category: PresetCategory;
  os?: PresetOS;
  icon: string;
  labelKey: string;
  descKey: string;
  payload: string;
  badge?: string;
}
```

### 1.2 Catalog of Preset Templates

#### Category 1: AI & Coding Assistants (`ai`)
- `claude_approve`: Claude Code CLI / Agent permission approval (`y`) — badge `y + ↵`
- `claude_compact`: Claude Code `/compact` session context reduction — badge `/compact`
- `claude_cost`: Claude Code `/cost` check token consumption — badge `/cost`
- `claude_clear`: Claude Code `/clear` reset conversation — badge `/clear`
- `codex_prompt_accept`: OpenAI Codex / ChatGPT CLI approval (`y`) — badge `y + ↵`
- `cursor_inline_edit`: Cursor AI Inline Edit (`/edit`) — badge `/edit`
- `copilot_chat`: AI Chat prompt (`/explain`) — badge `/explain`

#### Category 2: Window Management & OS Switching (`os`)
- `win_switch_window`: Windows App Switcher (`Alt+Tab`) — badge `Alt + Tab`
- `win_task_view`: Windows Task View / Virtual Desktops (`Win+Tab`) — badge `Win + Tab`
- `win_show_desktop`: Windows Minimize All / Show Desktop (`Win+D`) — badge `Win + D`
- `win_clipboard_history`: Windows Cloud Clipboard History (`Win+V`) — badge `Win + V`
- `mac_switch_app`: macOS Application Switcher (`Cmd+Tab`) — badge `Cmd + Tab`
- `mac_spotlight`: macOS Spotlight Search (`Cmd+Space`) — badge `Cmd + Space`
- `mac_mission_control`: macOS Mission Control (`Ctrl+Up`) — badge `Ctrl + ↑`

#### Category 3: Terminal & Developer Tools (`dev`)
- `git_status`: Git status check (`git status`) — badge `git status`
- `git_commit_quick`: Git quick commit (`git commit -v`) — badge `git commit`
- `git_diff`: Git difference overview (`git diff`) — badge `git diff`
- `terminal_clear`: Terminal screen clear (`clear`) — badge `clear`
- `docker_ps`: Docker running containers (`docker ps`) — badge `docker ps`
- `cli_exit`: Safe CLI exit (`exit`) — badge `exit`

#### Category 4: Productivity & Browser (`productivity`)
- `browser_reopen_tab`: Reopen closed browser tab (`Ctrl/Cmd+Shift+T`) — badge `Shift+T`
- `browser_close_tab`: Close active tab (`Ctrl/Cmd+W`) — badge `Ctrl+W`
- `browser_devtools`: Open Web Developer Tools (`F12`) — badge `F12`
- `quick_paste_log`: Quick Debug / Print statement (`console.log()`) — badge `log()`

---

## 2. UI / UX Design in `ActionPane.svelte`

1. **Preset Library Selector**:
   - When **"Phím tắt tùy chọn" (Custom Shortcut)** is selected, an expandable **"Thư viện gợi ý mẫu" (Preset Library)** component appears directly below the custom payload input field.
   - Filter Tabs:
     - `Tất cả` (All)
     - `🤖 AI & Assistants` (Claude, Codex, Copilot)
     - `🪟 Cửa sổ & OS` (Windows, macOS)
     - `💻 Terminal & Dev` (Git, Docker, CLI)
     - `⚡ Tiện ích` (Browser, Navigation)

2. **Interactive Template Card**:
   - Each card displays:
     - Icon with thematic accent color.
     - Title and localized description.
     - Shortcut preview badge (e.g., `y + ↵`, `git status`).
   - Clicking a card instantly populates the `customPayload` text field, sets the dirty draft flag, and highlights the active template.

3. **OS-Aware Recommendations**:
   - Automatically detects current OS (`navigator.userAgent` / platform) to prioritize Windows shortcuts on Windows and macOS shortcuts on macOS.

---

## 3. Localization (`i18n.ts`)
Full translation support across:
- **Tiếng Việt (`vi`)**
- **English (`en`)**
- **简体中文 (`zh-CN`)**

Example keys:
- `preset.category.all`: Tất cả / All / 全部
- `preset.category.ai`: Trợ lý AI (Claude, Codex) / AI Assistants / AI 助手
- `preset.category.os`: Chuyển cửa sổ & OS / Windows & OS / 窗口与系统
- `preset.category.dev`: Terminal & Lập trình / Terminal & Dev / 终端与开发
- `preset.category.productivity`: Tiện ích / Productivity / 效率工具
- Individual titles and descriptions for each shortcut item.

---

## 4. Verification & Testing Strategy
- Unit tests in `shortcutPresets.test.ts` to verify all template payloads, unique IDs, ASCII compliance (<= 128 bytes), and categorization.
- UI tests in `ActionPane.test.ts` (or component harness) verifying category filtering and 1-click payload population.
- End-to-end Vitest and Svelte check verification.
