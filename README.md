# Touch Pass

> Give every finger a superpower.

![Touch Pass: a fingerprint sensor beside a Mac mini](assets/demo/01-hero-showcase-v2.png)

## What is Touch Pass?

Touch Pass turns a small fingerprint reader into a personal command surface for your Mac. Enrol a fingerprint, choose what it should do, and make everyday moments—signing in, approving a prompt, opening a tool, or starting a flow—feel as immediate as a touch.

It is a TinyTouch-based project for people who would rather reach for a finger than remember one more shortcut.

## Ten fingers, ten useful actions

Each enrolled finger can be its own shortcut. Use the local portal to give every finger an action that fits your day:

| A finger can become | For example |
| --- | --- |
| a sign-in gesture | enter a prepared value when a login prompt is ready |
| a maker shortcut | open a frequently used project or command |
| a focus switch | jump into the next tool in your workflow |
| a small ritual | start the task you repeat every morning |

The point is not to automate everything. It is to make the ten actions you already reach for feel natural.

## Built for makers, vibe coders, and curious humans

Touch Pass is deliberately approachable: a compact ESP32-S3 build, a ZW101-style fingerprint sensor, and a browser-based setup experience. Build it, wire it, then make it yours.

Whether you are prototyping a desk companion, smoothing out a creative workflow, or simply curious about what a fingerprint reader can do beyond login screens, this is a project to tinker with in the open.

## How it works

The sensor recognizes an enrolled finger and reports its template ID to the controller. Touch Pass maps that ID to an action, then presents itself to your computer as a USB device.

For actions delivered through keyboard emulation, HID types into the **focused field**. That makes setup wonderfully flexible—and it also means you should always check where the cursor is before you touch the sensor.

## See it in action

![Touch Pass approving a Claude prompt on a Mac mini](assets/demo/02-mac-mini-claude-accept-v2.png)

From a fingerprint touch to a ready-to-go action, the experience is meant to disappear into the rhythm of your desk.

![Touch Pass feature overview](assets/demo/04-features.png)

## Start here

Choose the path that matches where you are:

- [Build Touch Pass](docs/BUILD_GUIDE.md) — parts, wiring, firmware, and first flash.
- [Use Touch Pass](docs/USER_GUIDE.md) — enrol fingers, assign actions, and use the local portal.
- [Hướng dẫn phần cứng và portal bằng tiếng Việt](docs/esp32-s3-zw101-portal-vi.md) — the Vietnamese hardware and portal guide.

## Before you trust it

Touch Pass is a convenient physical interface, not a security boundary. HID types into the focused field, so an unexpected or malicious prompt can receive whatever the action is configured to type.

The ZW101 UART is unauthenticated. A person with physical access to the device can potentially spoof sensor traffic; treat the hardware and the environment around it accordingly. Do not use Touch Pass for secrets or situations whose risk you have not assessed.

## Project status

This is an evolving, maker-focused project. Hardware choices, firmware behavior, and the setup experience may change as the project is tested in more real desks and workflows. Contributions, careful experiments, and clear issue reports are welcome.

## Built on TinyTouch

Touch Pass is built on [ZimengXiong/TinyTouch](https://github.com/ZimengXiong/TinyTouch), the open-source foundation for its fingerprint, USB, and embedded work. If TinyTouch helps you, consider contributing upstream or [supporting the original project](https://github.com/sponsors/ZimengXiong).
