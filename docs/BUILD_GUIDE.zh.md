# 构建 TouchPass

[🌐 **English**](BUILD_GUIDE.md) | [🇻🇳 **Tiếng Việt**](BUILD_GUIDE.vi.md) | 🇨🇳 **简体中文**

本指南将带您从零散的零部件开始，一步步在 Windows 或 macOS 上构建并运行本地 TouchPass Web 门户。
请在本项目仓库的根目录（包含 `README.md` 的文件夹）下按照本指南进行操作。TouchPass 是一种便捷的 USB HID 键盘接口，而非安全边界：它会向您计算机上当前处于 **focused**（聚焦）激活状态的窗口/输入框中输入内容，且传感器连接使用的是 **unauthenticated UART**（未经身份验证的 UART）链路。

## 您要构建的内容

您将把 ZW101 指纹传感器连接到 ESP32-S3 Super Mini 上，刷写 [TouchPass 固件](../firmware/tiny_touch_keyboard/tiny_touch_keyboard.ino)，然后运行本地 Helper 后台服务及 Web 门户（`http://127.0.0.1:8787/`）。Web 门户用于管理槽位 1 到 10 的指纹，并为已注册的手指分配动作。密码动作由 Helper 跨平台安全存储在 OS 原生凭据库中（Windows 凭据管理器 / macOS Keychain）；固件与 Helper 共享一个配对密钥，用于在 USB CDC 通道上对动作消息进行身份验证和加密。

![TouchPass 零部件爆炸图](../assets/demo/05-exploded-view-v3.png)

上图所示的渲染图是一幅 **conceptual**（概念设计图），并非精确的组装工程图或切割模板。本代码仓库不包含与上图外壳完全匹配的 CAD 模型。在购买或切割外壳之前，请务必实际测量您的开发板、传感器、线缆和外壳尺寸；市场上同名的小型模块可能会有尺寸差异。

## 零部件与工具

- ESP32-S3 Super Mini（固件代码中同样说明了 Waveshare ESP32-S3-Zero 作为兼容目标板）。
- ZW101 光学指纹传感器及其 6 针连接线。
- 一个通用项目外壳，尺寸约为 **80 × 50 × 32 mm**。在购买或切割前，请对照您的实际零部件检查外壳的*内部*空间。
- 至少 7 根支持 3.3V 安全电平的杜邦线以及一块小型无焊面包板（用于首次裸板测试）：6 根线用于传感器引脚，1 根线用于共享 3V3 电源轨。如需制作永久接线束，请使用短截的多股电子线。
- 适用于每个焊接接头的热缩管，以及用于拉力承受缓冲（Strain relief）的小型护线圈、线缆夹或自粘式扎带固定座。
- 用于 3V3 分流的小型低压接线端子或洞洞板（perfboard）。在完全绝缘的前提下，焊接的三通接线同样适用。
- 一根用于 ESP32-S3 的 USB **数据**传输线；许多仅供充电的线缆无法刷写固件或识别串口。
- 一台电脑（Windows 10/11、macOS 或 Linux），已安装 Arduino IDE 或 `arduino-cli`、Python 3.9+，以及用于安装 Helper 依赖项的网络连接。
- 直尺或游标卡尺、遮蔽胶带、铅笔或细标记笔、带手电钻头的小型手钻（如有阶梯钻头更好）、用于开矩形孔的手工锯或旋转工具、小型锉刀和护目镜。
- 如需焊接线束：可调温电烙铁、电子焊锡丝、剥线钳、剪线钳以及带通断测试（Continuity）功能万用表。

在制作或修改电路连接时，请务必保持传感器和开发板处于断电状态。

## 接线说明

ZW101 传感器的两个供电引脚均使用 3.3V 逻辑和电源。**切勿将 ZW101 的 VCC 或任何 UART 信号线连接到 5V。** TX 和 RX 信号线需要交叉连接：传感器的 TX 发送引脚连接至 ESP32 的接收引脚，传感器的 RX 接收引脚连接至 ESP32 的发送引脚。

| ZW101 引脚 | ESP32-S3 Super Mini 引脚 |
| --- | --- |
| V_TOUCH (Pin 1) | 3V3 |
| TouchOut (Pin 2) | GPIO1 |
| VCC (Pin 3) | 3V3 |
| TX (Pin 4) | GPIO6 / ESP RX |
| RX (Pin 5) | GPIO7 / ESP TX |
| GND (Pin 6) | GND |

`V_TOUCH` 与 `VCC` 是独立的传感器引脚，**两者均需要 3V3 供电**。如果您的开发板上只有一个 `3V3` 引脚，请制作一个绝缘的三通接点：从开发板的 `3V3` 引脚引出一根线分流为两根线，分别连接至 `V_TOUCH` 和 `VCC`。可以使用用热缩管完全覆盖的焊接接头、小型接线端子或洞洞板。对于裸板测试，无焊面包板的电源轨可作为临时接点；请勿将松散的面包板塞入最终完成的外壳中。切勿用手扭结裸线并用胶带缠绕，也不要将两根松散的导线强行塞入同一个杜邦线插座中。在 USB 依然断开的情况下，使用万用表通断模式确认两个传感器供电引脚均通往 `3V3`，且 `3V3` 与 `GND` 之间没有短路。

请勿使用 ESP32-S3 的 Strapping 引脚 GPIO0、GPIO3、GPIO45 或 GPIO46 代替上述连接。固件使用上述引脚映射，并以 57,600 波特率与传感器通信。

## 组装步骤

### 优先进行裸板测试

您可以在没有外壳的情况下完成首次固件刷写和 Web 门户测试。这是在切割外壳前捕获接线错误最简单有效的方法。

1. 在 USB 断开的情况下，构建绝缘的 3V3 接点，并严格按照表格所示连接所有 6 个传感器引脚。
2. 再次检查 `V_TOUCH` 和 `VCC` 是否通往 `3V3`（绝非 `5V`），TX/RX 是否交叉连接，以及是否有裸露导线接触到其他引脚。
3. 将松散的开发板和传感器平放在干净、绝缘且不会移动或接触金属的表面上。
4. 仅连接 ESP32-S3 的 USB 数据传输线。电脑将通过 USB 为开发板供电；切勿向 ZW101 额外引入独立的 5V 供电。
5. 继续完成下文的 **刷写固件**、**启动 Helper 与 Web 门户** 以及物理检测步骤。在移动电路前再次断开 USB。

### 安装通用外壳

请仅在裸板测试成功通过后再开始外壳加工。

1. 测量开发板、传感器主体、传感器边缘、USB 插头及线缆弯曲半径的实际尺寸。在约 80 × 50 × 32 mm 的外壳内部进行试装（Dry-fit）。
2. 将传感器触控面朝外穿过顶盖或前壁，确保手指能够平稳按压。定向 ESP32-S3，使其 USB 接口面向外壳边缘，且无需拉拽开发板即可插拔。
3. 用遮蔽胶带覆盖外壳外部的切割区域。将实物测量尺寸标记在外壳上，划出中心线和开口轮廓，然后从内部和外部反复检查方向。切勿根据渲染图按比例放大尺寸。
4. 在钻孔或切割前取下所有电子零部件。从标记的外侧面钻出一个小型引导孔，逐渐扩大，对矩形开口使用角孔结合小锯或锉刀。请佩戴护目镜并保持双手远离工具。
5. 去除所有毛刺和屑料。再次试装；绝不能有锐边接触线缆，外壳也不得挤压指纹面板或 USB 插头。
6. 使用绝缘螺柱或电子安全胶固定零部件。为传感器引线及穿过外壳壁的线缆添加应力缓冲（Strain relief），在每个连接器前留出少许松弛量。
7. 用热缩管覆盖每一个焊接接头，重复通断与短路检查，合上外壳，最后再重新连接 USB。

## 准备您的环境

在终端中，切换到代码仓库根目录，然后创建项目本地的 Python 虚拟环境并安装 Helper 依赖项：

```bash
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r software/macos-helper/requirements.txt
```

在配置任何内容之前，请运行以下自动化文件检查。它们验证您是否处于预期的代码目录中，以及本指南中的命令是否指向真实的项目文件。每个命令的退出状态应为 `0` 且不打印任何错误。

```bash
test -f firmware/tiny_touch_keyboard/tiny_touch_keyboard.ino
test -f firmware/tiny_touch_keyboard/secrets.example.h
test -f software/macos-helper/requirements.txt
test -f software/macos-helper/tinytouch_helper.py
```

这些仅为文件存在性检查；它们并不验证您的接线、开发板、USB 线缆或指纹传感器。

## 创建配对密钥

这是一个 **first-time only**（仅限首次设置）的操作流程。请勿将其作为故障修复步骤重复运行。Helper 的默认 Keychain 身份为服务 `tinyTouch-pairing` 下的账户 `B8F862FB478C`；下文命令显式使用了该默认值。

在仓库根目录下运行完整代码块。在创建任何内容前，它会同时检查现有的 `secrets.h` 和 Keychain 中现有的配对项。如果其中任何一个已存在，它将打印 `STOP` 且不进行任何替换。`cp -n` 命令是第二个防覆盖保护。停止可能意味着此前已完成设置，或先前的尝试中途停止；如果您不确定，请保留两份副本，并使用下文的轮换流程进行同步。

```bash
(
  pairing_device_id="B8F862FB478C"
  pairing_service="tinyTouch-pairing"
  secrets_file="firmware/tiny_touch_keyboard/secrets.h"
  pairing_conflict=0

  if [ -e "$secrets_file" ]; then
    printf 'STOP: %s already exists; it was not overwritten.\n' \
      "$secrets_file" >&2
    pairing_conflict=1
  fi

  if security find-generic-password -a "$pairing_device_id" \
    -s "$pairing_service" >/dev/null 2>&1; then
    printf 'STOP: Keychain pairing item %s/%s already exists.\n' \
      "$pairing_service" "$pairing_device_id" >&2
    pairing_conflict=1
  fi

  if [ "$pairing_conflict" -ne 0 ]; then
    printf 'Use the intentional rotation instructions below only when needed.\n' >&2
    exit 1
  fi

  cp -n firmware/tiny_touch_keyboard/secrets.example.h "$secrets_file" || exit 1
  pairing_key="$(openssl rand -hex 32)" || exit 1
  printf 'Copy this C++ byte list into secrets.h:\n'
  printf '%s' "$pairing_key" | sed 's/../0x&, /g'
  printf '\n'

  if ! .venv/bin/python software/macos-helper/tinytouch_helper.py \
    --device-id "$pairing_device_id" --set-pairing-key "$pairing_key"; then
    unset pairing_key
    exit 1
  fi
  unset pairing_key
)
```

该代码块将 C++ 字节列表打印一次，在 Keychain 中存储相同的密钥，然后通过 `unset pairing_key` 将其清除。从终端输出中复制显示的列表。请勿将其粘贴到聊天窗口、Issue 或 Commit 中。Helper 将通过打印以下内容确认 Keychain 步骤：

```text
pairing key stored in Keychain
```

打开 `firmware/tiny_touch_keyboard/secrets.h`。将 `PAIRING_KEY` 内部的 32 个 `0x00` 值替换为显示的以逗号分隔的 `0xNN` 值。保留周围的大括号和分号。本地的 `secrets.h` 文件已被 Git 忽略；切勿提交或共享该文件。

### 配对密钥的主动轮换流程 (Pairing Key Rotation)

请勿删除其中一份副本并重新运行首次设置代码块。主动密钥轮换必须**基于相同的新密钥同时更新 Keychain 与现有的 `secrets.h`，然后重新刷写固件 (reflash)**。如果仅更改了一份副本，TouchPass 动作的身份验证将失效。

停止 Helper。生成一个替换密钥并打印其固件字节：

```bash
pairing_key="$(openssl rand -hex 32)"
printf '%s' "$pairing_key" | sed 's/../0x&, /g'
printf '\n'
```

在该变量保留在终端期间，将现有的 `secrets.h` 中的所有 32 个字节替换为显示的列表。然后主动更新对应的 Keychain 项并清除 Shell 变量：

```bash
.venv/bin/python software/macos-helper/tinytouch_helper.py \
  --device-id B8F862FB478C --set-pairing-key "$pairing_key"
pairing_result=$?
unset pairing_key
[ "$pairing_result" -eq 0 ]
```

立即再次**验证**并**上传** Sketch，以便使用相同的密钥重新刷写开发板。仅在上传完成后重新启动 Helper。

## 配置 Arduino

1. 从 [Arduino 官方下载页面](https://www.arduino.cc/en/software) 安装 Arduino IDE 2。
2. 打开 **工具 → 开发板 → 开发板管理器**，搜索 `esp32`，选择由 **Espressif Systems** 提供的 **esp32**，选择版本 **3.3.11**，然后点击 **安装**。本指南的固件与设置已在 ESP32 Arduino Core 3.3.11 版本上通过测试。

在 Arduino IDE 中打开 [固件 Sketch](../firmware/tiny_touch_keyboard/tiny_touch_keyboard.ino)。在开发板和工具菜单中，选择以下准确设置：

| Arduino 设置项 | 设定值 |
| --- | --- |
| Board | `ESP32S3 Dev Module` |
| USB Mode | `USB-OTG (TinyUSB)` |
| USB CDC On Boot | `Enabled` |
| Flash Size | `4MB` |
| PSRAM | `Disabled` |

同时选择属于您的 ESP32-S3 的串口。在 Waveshare ESP32-S3-Zero 上，如果上传未开始，请按住 **BOOT** 键，按下并释放 **RESET** 键，释放 **BOOT** 键，然后重新开始上传。

### 选项 A：使用 `arduino-cli`（命令行）

您可以直接使用 `arduino-cli` 编译并刷写固件：

```bash
# 编译固件
arduino-cli compile --fqbn esp32:esp32:esp32s3:CDCOnBoot=cdc,UploadMode=cdc firmware/tiny_touch_keyboard

# 刷写固件（Windows COM 串口示例）
arduino-cli upload -p COM3 --fqbn esp32:esp32:esp32s3:CDCOnBoot=cdc,UploadMode=cdc firmware/tiny_touch_keyboard

# 刷写固件（macOS 设备示例）
arduino-cli upload -p /dev/cu.usbmodem101 --fqbn esp32:esp32:esp32s3:CDCOnBoot=cdc,UploadMode=cdc firmware/tiny_touch_keyboard
```

### 选项 B：使用 Arduino IDE GUI 界面

1. 在 Arduino IDE 中，点击 **验证**（Verify）。在继续前修复报告的任何错误。
2. 点击 **上传**（Upload）并等待 Arduino IDE 报告上传完成。
3. 如果打开了 Arduino IDE 的串口监视器，请将其关闭。Helper 需要独占 USB CDC 串口。

此时开始进行物理检查：成功的编译或上传并不能证明传感器接线正确。

## 启动 Helper 与 Web 门户

### Windows 环境（1-Click 启动器 - 推荐）

只需双击项目根目录下的 **`start_touchpass.bat`**。它会自动启动 Helper 后台服务并在您的默认浏览器中打开 `http://127.0.0.1:8787/`！

或通过命令提示符 / PowerShell 手动运行：
```powershell
python run_portal_win.py
```

### macOS / Linux 环境

在仓库根目录下启动 Helper。它会自动启动 Web 门户并监听您计算机的环回地址：

```bash
.venv/bin/python software/macos-helper/tinytouch_helper.py
```

在浏览器中打开 [http://127.0.0.1:8787](http://127.0.0.1:8787)。如果连接了多个 USB CDC 设备，请指定您的设备端口：

```bash
.venv/bin/python software/macos-helper/tinytouch_helper.py --port COM3
```

Helper 通常会自动发现单个 USB CDC 设备。在此命令运行期间，请勿运行 Arduino 串口监视器，因为同一时间只能有一个程序占用串口。

## 首次构建检查清单

### 自动化文件检查

- **准备您的环境** 中的 4 个 `test -f` 命令各自以状态码 `0` 退出。

### 构建检查点

- Arduino IDE 完成了 **验证** 与 **上传** 且无任何错误。

### 软件检查点

- Helper 打印出了 Web 门户地址，且浏览器成功打开了 `http://127.0.0.1:8787`。

### 物理检查点

- Web 门户显示 ESP32-S3 已连接；如果没有，请检查 USB 数据线、选择的端口以及 **USB CDC On Boot** 设置。
- 在 Web 门户中，配置一个未使用的槽位，选择一个动作，然后保存。
- 在收到提示时录制手指：触摸一次，根据提示抬起，然后再次触摸同一手指。
- 将光标放在无害的文本编辑器中并触发动作。确认按键输出到当前处于 focused 聚焦激活状态的区域。对于非密码动作，请在 3 秒内再次抬起并触摸同一手指进行确认。

请勿在开始时就将密码放入敏感的登录输入框中。请先通过文本编辑器中的无害动作证明 Focused 聚焦窗口的行为特征。

## 故障排查

| 故障现象 | 检查与解决方案 |
| --- | --- |
| Helper 提示未找到 ESP32-S3 USB CDC 设备 | 使用 USB 数据传输线，重新连接开发板，确认 `USB CDC On Boot` 已启用，必要时使用 `--port` 重试。 |
| Arduino 无法上传固件 | 确认所选的端口和开发板设置。对于 Waveshare ESP32-S3-Zero，请使用 **配置 Arduino** 中的 BOOT/RESET 按键序列。 |
| ESP32-S3 已连接但传感器不可用 | 重新检查传感器 TX 是否通往 GPIO6，RX 是否通往 GPIO7，两个供电引脚是否均为 3V3，GND 是否共地，且没有 ZW101 UART 引脚接入 5V 电压。 |
| 已识别的手指未执行配置的动作 | 确认 `secrets.h` 和 Keychain 使用完全相同的配对密钥，修改 `secrets.h` 后重新刷写固件。 |
| 文本出现在错误的位置 | 这是当未聚焦在正确的应用或输入框时标准的 HID 键盘行为。在触摸传感器前，请先聚焦到无害的目标窗口。 |
| 密码字符不正确 | 将键盘输入源切换为 `ABC` 或 `US`；密码动作发送 ASCII 键盘输入。 |
| Accept、Enter、Escape 或自定义动作触摸一次后无响应 | 这些动作设计上需要同根手指在 3 秒内再次触摸以进行二次确认。 |

有关越南语硬件与门户指南，请参阅 [`BUILD_GUIDE.vi.md`](BUILD_GUIDE.vi.md)。

## 自动化测试所验证的内容

在仓库根目录下运行自动化质量测试网关：

```bash
python run_test_gate.py
```

这将运行一个 4 阶段的自动化测试网关：Python 文件语法编译检查、完整的 pytest 单元测试套件（70 个测试用例）、实时 Web 门户 HTTP & CSRF API 验证以及 CLI 健全性检查。

若需运行单独的文档或协议测试：

```bash
python -m unittest tests/test_documentation.py
```

它将检查项目指南和经批准的图像资产是否存在、本地 Markdown 链接是否能正确解析，以及可见文档中是否包含聚焦 HID 与未授权 UART 的安全限制。它**不会**编译固件、上传至开发板、检测 USB 设备、验证 3.3V 接线、注册指纹或证明真实的 HID 动作是否到达了预期的输入框。这些属于上述检查清单中的物理检查项目。
