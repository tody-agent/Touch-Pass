# TouchPass 用户指南与文档

[🌐 **English**](USER_GUIDE.md) | [🇻🇳 **Tiếng Việt**](USER_GUIDE.vi.md) | 🇨🇳 **简体中文** | [🇷🇺 **Русский**](USER_GUIDE.ru.md)

欢迎阅读 **TouchPass** 官方用户指南 — 这是一个基于 ESP32-S3 微控制器和 ZW101 指纹传感器构建的开源生物识别与开发者宏自动化平台。

---

## 目录

1. [架构分离：固件 vs 本地 Helper](#1-架构分离固件-vs-本地-helper)
2. [TouchPass 平台概览](#2-touchpass-平台概览)
3. [自助式 4 步引导](#3-自助式-4-步引导)
4. [交互式快捷键录制器](#4-交互式快捷键录制器)
5. [AI 开发者工具快捷键预设库](#5-ai-开发者工具快捷键预设库)
6. [调试控制台与实时事件日志](#6-调试控制台与实时事件日志)
7. [安全与防护检查清单](#7-安全与防护检查清单)
8. [故障排查指南](#8-故障排查指南)
9. [安全策略与法律声明](#9-🛡️-安全策略与法律声明--tuyên-bố-miễn-trừ-trách-nhiệm)

---

## 1. 架构分离：固件 vs 本地 Helper

TouchPass 在设计上明确划分了 **硬件固件（ESP32-S3 Firmware）** 与 **本地 Helper（宿主软件 Host Software）** 的职责，以确保高性能表现与生物识别凭据安全性。

### 架构数据流示意图

```text
┌─────────────────────────┐
│ 指纹传感器              │ (ZW101 扫描与指纹比对)
│ (ZW101 Sensor)          │
└────────────┬────────────┘
             │ UART 串口 (匹配槽位 / IRQ 中断触发)
             ▼
┌─────────────────────────┐
│ ESP32-S3 固件           │
│ (tiny_touch_keyboard)   │
└──────┬───────────▲──────┘
       │           │
  USB  │           │ USB 键盘输出
 串口  │           │ (直接自动输入 HID 按键)
       ▼           │
┌──────────────────┴──────┐
│ Python 本地 Helper       │ (run_portal_win.py / tinytouch_helper.py)
│ (http://127.0.0.1:8787) │
└────────────┬────────────┘
             │ 安全凭据检索
             ▼
┌─────────────────────────┐
│ OS 原生凭据存储区       │ (Windows 凭据管理器 / macOS Keychain)
└─────────────────────────┘
```

- **ESP32-S3 固件**：负责底层 ZW101 UART 串口通信、LED 控制、HMAC-SHA256 协议验证、AES-CTR 解密以及硬件 USB HID 键盘按键输入。
- **本地 Helper 服务**：管理本地 Web 门户 HTTP 服务器，处理指纹注册请求，并安全地从用户专属的 per-user helper OS Keychain / Credential Manager 中提取密码凭据。

---

## 2. TouchPass 平台概览

TouchPass Web 门户在 `http://127.0.0.1:8787/` 提供了完整的控制面板，用于管理多达 10 个生物识别指纹槽位。

### 动作限制与约束
- **最大动作长度 (Maximum Action Length)**：每个槽位最多支持 **16 steps**（16 个步骤）或最大 **256 encoded bytes**（256 个编码字节）。如果动作序列超过 256 字节，保存将因校验错误而失败（save fails with a validation error）。
- **双击确认安全防护 (Double-Touch Confirmation Safety)**：密码执行在单次触摸后即可运行。非密码动作（Accept、Enter、Escape、自定义宏）需要连续触摸同一手指 **两次且在 3 秒以内**（twice within 3 seconds），以防止误触引发意外操作。

---

## 3. 自助式 4 步引导

Web 门户包含一个用于初始设置的 4 步向导：

1. **步骤 1：测试 USB HID 按键** — 验证计算机是否将 ESP32-S3 识别为 USB HID 键盘。
2. **步骤 2：检查硬件接线** — 确认 ESP32-S3 与 ZW101 之间的 UART 串口通信正常。
3. **步骤 3：录制首个指纹** — 在槽位 01（Slot 01）中录制手指。
4. **步骤 4：分配首个动作** — 为已录制的槽位分配快捷键或密码填充动作。

---

## 4. 交互式快捷键录制器

Web 门户集成了交互式 **快捷键录制器（Shortcut Recorder）**：
- 按下任意物理按键或修饰键组合（`Ctrl`、`Shift`、`Alt/Option`、`Cmd/Meta`）。
- 录制器会自动捕获按键码（keycodes）与修饰键掩码（modifier bitmasks）。
- 点击 **Save Action**（保存动作）将录制的宏直接上传至设备。

---

## 5. AI 开发者工具快捷键预设库

内置针对主流开发者与 AI 工具的一键预设：

- 🤖 **Claude Code CLI**：`y` + `Enter`（接受 Prompt 许可）
- 💻 **Cursor IDE**：`Cmd+K` / `Ctrl+K`（行内 AI 编辑）
- 🖥️ **Claude Desktop**：`Cmd+Space` / `Ctrl+Space`（全局 AI 全速启动器）
- 🚀 **Antigravity IDE**：`Ctrl+Shift+A`（Agentic AI 命令窗口）

---

## 6. 调试控制台与实时事件日志

Web 门户包含带彩色徽章的实时事件日志监视器：
- 🟢 `TOUCH`：检测到指纹传感器触摸。
- 🔵 `MATCH`：指纹匹配到已存储的槽位 ID。
- 🔑 `PW`：从凭据存储区提取密码并完成执行。
- 🔴 `ERR`：检测到错误或无效的 HMAC MAC 签名。
- ⚪ `SYS`：系统状态更新或串口重新连接事件。

---

## 7. 安全与防护检查清单

- **Focused 聚焦窗口安全**：TouchPass 作为标准 USB HID 键盘工作。按键会直接输入到当前处于 active focused 激活聚焦状态的应用窗口中。在触摸传感器之前，请务必核对您的光标位置。
- **凭据存储**：密码由 per-user helper 安全保存在 OS 凭据存储区中（Windows Credential Manager / macOS Keychain）。
- **会话解锁限制**：TouchPass 支持用户在已登录状态下的 session unlock（会话解锁）。它不支持 FileVault cold boot（冷启动解锁）或 after logout（注销后的解锁），因为在用户会话登录之前，用户专属的 helper 及 Keychain 服务处于锁定状态。

---

## 8. 故障排查指南

| 故障现象 | 可能原因 | 解决方案 |
| :--- | :--- | :--- |
| 门户显示 `Disconnected` | USB 串口未打开 | 检查 USB 数据线并确保固件中启用了 `USB CDC On Boot`。 |
| 传感器 LED 保持关闭 | 电源接线问题 | 重新检查 `V_TOUCH` 和 `VCC` 到 `3V3` 的连接。 |
| 动作保存失败或拒绝 | 超出限制 | 确保宏序列在 16 个步骤和 256 个编码字节限制以内。 |

---

## 9. 🛡️ 安全策略与法律声明 / Tuyên Bố Miễn Trừ Trách Nhiệm

TouchPass 按 **"原样"（"AS IS"）** 提供，不提供任何形式的明示或暗示保证。用户对物理硬件组装、接线图核对、电压安全（3.3V 电源轨）、生物识别传感器校准和物理凭据安全承担全部责任。

TouchPass được cung cấp **"NGUYÊN TRẠNG" (AS IS)** và không có bất kỳ bảo hành nào. Người dùng tự chịu toàn bộ trách nhiệm đối với việc đấu nối phần cứng vật lý, an toàn nguồn 3.3V, hiệu chuẩn cảm biến vân tay quang học và bảo vệ thiết bị.

- 🇺🇸 **English**：有关安全架构细节、受支持版本、漏洞报告及责任限制的完整内容，请参阅 **[Security Policy & Legal Disclaimer (SECURITY.md)](../SECURITY.md)**。
- 🇨🇳 **简体中文**：有关安全架构细节、受支持版本、漏洞报告及责任限制的完整内容，请参阅 **[安全策略与法律声明 (SECURITY.zh.md)](translations/SECURITY.zh.md)**。
- 🇻🇳 **Tiếng Việt**：Chi tiết về quy trình báo cáo lỗ hổng, các phiên bản hỗ trợ và miễn trừ trách nhiệm pháp lý, vui lòng tham khảo **[Chính Sách Bảo Mật (SECURITY.vi.md)](translations/SECURITY.vi.md)**。
