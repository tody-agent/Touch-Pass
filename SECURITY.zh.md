# 🛡️ TouchPass 安全策略与法律声明

[🌐 **English**](SECURITY.md) | [🇻🇳 **Tiếng Việt**](SECURITY.vi.md) | 🇨🇳 **简体中文** | [🇷🇺 **Русский**](SECURITY.ru.md)

---

本文档详细说明了 **TouchPass** 的安全架构、威胁模型、受支持的版本、漏洞报告流程、操作最佳实践以及法律声明。

---

## 1. 🏗️ 安全架构概览

TouchPass 基于多层纵深防御安全模型构建，连接了物理硬件生物识别、密码学串口通信、宿主原生凭据库以及浏览器沙箱 API：

1. **硬件生物识别（芯片内比对）**：指纹注册、特征提取、模板存储和 1:N 生物识别比对完全在 ESP32-S3 微控制器连接的 ZW101 光学指纹传感器内部独立完成。没有任何原始指纹图像、细节特征数据或生物识别模板会被通过 USB 传输、写入宿主磁盘文件或同步至云端服务。
2. **HMAC-SHA256 挑战协议与加密串口通信**：宿主计算机 Daemon 与 ESP32-S3 固件之间通过 Serial UART / USB 物理通道进行的通信采用了密码学挑战应答协议。请求使用 HMAC-SHA256 结合单次使用的滚动随机数（Nonce）进行签名，以防止重放攻击、未授权的串口消息注入以及通道篡改。载荷通信还支持 AES-CTR 加密。
3. **OS 原生凭据存储集成**：敏感密码、sudo 凭据和 API 密钥绝不会以明文形式保存在代码仓库、配置文件或微芯片 Flash 闪存中。TouchPass 在需要时通过 `keyring` 直接从操作系统原生安全凭据库中提取凭据：
   - **Windows**：Windows Credential Manager（通过 `win32crypt` / `keyring`）
   - **macOS**：macOS Keychain Services（通过 `keyring`）
   - **Linux**：Secret Service API / Freedesktop SecretService（通过 `keyring`）
   凭据仅在执行请求动作所需的极短时间内保留在宿主 RAM 内存中，并在执行完毕后立即擦除。
4. **WebUSB / WebSerial 与 Web 门户沙箱**：基于浏览器的 Web 刷机工具严格运行在现代浏览器的 WebUSB/WebSerial 安全沙箱中。本地 TouchPass Web 门户 Daemon 仅绑定至本地环回地址（`127.0.0.1:8787`），并强制执行严格的跨源资源共享（CORS）请求头和来源校验，以阻止未授权的远程网站触发本地动作。
5. **USB HID 按键执行**：经过验证的生物识别触发器会直接向当前处于 Focused（聚焦）激活状态的应用窗口发送原生 USB HID 键盘按键。TouchPass 无法点击图形界面 GUI 按钮、无法与未聚焦的后台应用交互，也无法突破操作系统的应用隔离边界。

---

## 2. 🛡️ 威胁模型与缓解矩阵

下表详细列出了 TouchPass 的威胁模型、已识别的风险向量以及实施的安全防护措施：

| 威胁向量 | 风险等级 | 缓解机制 |
| :--- | :--- | :--- |
| **物理加密狗被盗** | 中等 | 硬件加密狗内仅存储配对的 HMAC 密钥。按键释放必须在 ZW101 传感器上完成物理生物识别比对；仅窃取硬件本身无法解锁凭据。 |
| **USB / 串口窃听** | 中等 | 串口通信使用附带滚动随机数的 HMAC-SHA256 消息签名；可选的 AES-CTR 载荷加密可防止被动通道窃听。 |
| **重放攻击** | 中等 | 一次性单次使用的挑战随机数与时间戳确保捕获的 USB 串口数据帧无法被未授权软件重新发送。 |
| **宿主恶意软件 / 内存抓取** | 高 | 凭据安全存储在 OS 原生凭据库（Keychain / Credential Manager）中，仅在硬件批准后加载至内存，并在执行完毕后立即擦除。 |
| **Web 门户远程利用** | 高 | 本地服务器严格绑定至 `127.0.0.1` 环回地址；API 请求需要严格的 CORS 来源验证和本地会话校验。 |
| **生物识别传感器伪造** | 低-中等 | ZW101 光学指纹传感器特征比对防伪，误识率（FAR）< 0.001%，且具备本地硬件验证能力。 |

---

## 3. 📋 支持的版本

针对以下软件和固件版本，项目团队将积极维护安全补丁与漏洞更新：

| 版本 | 是否支持 | 状态与维护说明 |
| :--- | :--- | :--- |
| `2.0.x` | ✅ 支持 | 当前活跃的生产发布版本（双语 Web 门户、Web 刷机工具与 USB HID）。 |
| `< 2.0.0` | ❌ 不支持 | 早期预览版本；安全修复不会反向移植至过时版本。 |

---

## 4. 🚨 报告安全漏洞

我们非常重视 TouchPass 的安全性。如果您发现或怀疑 TouchPass 的硬件、固件或软件组件中存在安全漏洞，请负责任地进行报告：

1. **请勿在公开的 GitHub Issue 中创建报告** 或在公共论坛发布未披露漏洞的细节。
2. 请通过电子邮件 `security@touchpass.dev` 或通过 **GitHub Private Vulnerability Reporting（私密漏洞报告功能）** 向项目维护者提交详细报告。
3. 请在报告中包含以下详细信息：
   - 漏洞的清晰描述及其潜在的安全影响。
   - 分步重现指南或概念验证（PoC）代码。
   - 软件版本、操作系统环境及硬件版本（ESP32-S3 / ZW101）。

### 漏洞响应 SLA 时间表
- **确认收到**：在收到报告后的 **48 小时** 内。
- **评估与修复计划**：在 **7 个工作日** 内。
- **协调公开披露**：与官方安全补丁同时发布或在补丁发布之后披露。

---

## 5. 🔒 针对操作者的安全最佳实践

为在部署和使用 TouchPass 时确保最高安全性：

- **官方固件来源**：仅刷写从官方代码仓库 Release 编译的固件，或使用经过验证的 [TouchPass Web 刷机工具](https://tody-agent.github.io/Touch-Pass/web/flasher/)。
- **物理硬件安全**：将您的 TouchPass 硬件加密狗视为物理钥匙。请勿在不可信的环境中将加密狗连接在无人看管的电脑上。
- **配对密钥安全**：妥善保管宿主机与硬件之间的 HMAC 配对密钥。如果宿主系统或加密狗受到泄露威胁，请轮换您的配对密钥并在 OS 凭据管理器中重新注册凭据。
- **操作系统账户保护**：在宿主工作站上保持全盘加密（BitLocker / FileVault）并设置较短的屏幕锁定超时时间。

---

## 6. ⚖️ 法律声明与责任限制

### 免责声明 (Disclaimer of Warranty)

> **TOUCHPASS IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS, MAINTAINERS, OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE, FIRMWARE, HARDWARE WIRING, OPTICAL BIOMETRIC SENSORS, OR THE USE OR OTHER DEALINGS IN TOUCHPASS.**

> **TOUCHPASS 按 "原样"（"AS IS"）提供，不提供任何形式的明示或暗示保证，包括但不限于对适销性、特定用途的适用性和非侵权性的保证。在任何情况下，作者、维护者或版权所有者均不对因软件、固件、硬件接线、光学生物识别传感器或使用 TOUCHPASS 产生的任何索赔、损害或其他责任承担责任。**

### 用户责任与硬件安全 (User Responsibility & Hardware Safety)

- **物理接线与电源安全**：用户对物理硬件组装、接线图核对、电压等级安全（确保 3.3V 电源轨与 5V 电源轨隔离）以及光学传感器校准承担全部责任。
- **凭据与按键安全**：TouchPass 在成功完成生物识别验证后自动模拟本地键盘按键并从 OS 原生安全凭据库中提取凭据。用户单方面负责保障对其硬件加密狗的物理访问安全、核对处于 Focused 激活状态的终端窗口，并维护操作系统账户的安全。

---

## 7. 🙏 致谢与原作者归属

TouchPass 构建于 **[Zimeng Xiong](https://github.com/ZimengXiong)** 所创建的 **[TinyTouch](https://github.com/ZimengXiong/TinyTouch)** 项目的基石架构、硬件生物识别概念及开源代码库之上。我们向 Zimeng Xiong 以及所有原始开源贡献者致以最深切的感谢，感谢他们开拓了开源硬件 USB 生物识别安全设备。
