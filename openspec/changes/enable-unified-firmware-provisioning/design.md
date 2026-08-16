# Design: Configure and Use Unified Firmware from TouchPass Desktop

## Context & Technical Approach

The live device on COM9 reports:

`OK STATUS firmware=unified mode=piv sensor=ok fingerprints=1 keys=unconfigured hid_key=unconfigured ...`

The desktop already supports STATUS, CONFIG_UNLOCK, ENROLL, DELETE, EV, ARM, and ACT. It does not send `HID_KEY <hex>` or `MODE hid`, so a fresh unified ESP-IDF device can connect and enroll but cannot authenticate or execute desktop actions.

The selected approach is a shared HID bootstrap state machine:

1. Generate or load one 32-byte random pairing key, staging new candidates durably in OS secure storage.
2. Run `CONFIG_UNLOCK` through the existing fingerprint authorization gate.
3. Send `HID_KEY <64 hex>` and require `OK HID_KEY`.
4. Send `MODE hid` and require `OK MODE mode=hid`.
5. Commit the staged desktop key only after both firmware acknowledgements, compensating back to the old device key if persistence fails.
6. Continue enrollment when bootstrap was triggered by Save and Enroll.

Settings also exposes an explicit Configure/Repair HID action that uses the same state machine. Existing Arduino firmware that reports `mode=hid hid_key=configured` bypasses bootstrap and keeps the current flow.

## Options Considered

- Manual CLI provisioning: rejected because it does not satisfy app-led setup.
- Settings-only provisioning: safer than CLI but adds a required step users can miss.
- Automatic enrollment preflight plus explicit Settings repair: selected for first-use success and recoverability.

## Proposed Changes

### Rust secure storage

- Add prepare/commit/discard pairing-key operations using `OsRng` and a durable pending keyring entry.
- Store only hex-encoded key material in the existing TouchPass keyring service; never overwrite the live key before firmware acknowledgement.
- Reuse a pending key after an interrupted flow and roll the device back to the old key when a post-ACK live-key commit fails.
- Reuse the same key for EV verification and ACT encryption after provisioning.

### Rust serial protocol and admin flow

- Parse `OK/ERR HID_KEY` and `OK/ERR MODE` as typed firmware lines.
- Add an admin `ConfigureHid` operation with phases Unlocking → SettingKey → SettingMode.
- Allow ConfigureHid to continue into Enroll without releasing the authorization window.
- Add a reply channel for explicit Settings provisioning and structured errors for timeout, disconnect, or firmware rejection.
- Update cached status to `mode=hid`, `hidKeyConfigured=true` only after both acknowledgements.

### Tauri commands and frontend bridge

- Add `configure_hid_mode` command.
- Make `start_enrollment` request automatic bootstrap when live status is not HID-ready.
- Add typed bridge API and fixture behavior.

### Settings and device guidance

- Show HID automation readiness in Device settings.
- Offer Configure HID when not ready and Repair pairing when already ready.
- Require a confirmation dialog before repair because it rotates the device pairing key.
- Keep the main Save and Enroll CTA; it automatically performs bootstrap first.
- Localize all new labels, progress, success, and errors in vi/en/zh-CN.

## Assumptions

- Verified: the target is the unified runtime currently on COM9 (VID 303A, PID 4001).
- Verified: firmware implements CONFIG_UNLOCK, HID_KEY, MODE hid, ENROLL, EV/ARM/ACT.
- Verified: the sensor is ready and one fingerprint exists, so CONFIG_UNLOCK will prompt for an existing finger.
- Scoped: one active TouchPass device uses the existing `default` pairing account.
- Out of scope: PIV certificate provisioning, firmware flashing, firmware changes, multi-device key selection, and factory reset.

## Verification

- Rust unit tests for pairing-key creation/reuse and every HID admin transition/failure.
- Contract test for typed HID_KEY/MODE responses and public command serialization.
- Frontend tests for Settings readiness, configure/repair confirmation, loading, and localized copy.
- Enrollment tests prove bootstrap bypass for already-ready firmware and bootstrap-then-enroll for fresh unified firmware.
- Run frontend gate, Cargo fmt/clippy/tests, Tauri NSIS build, and Windows native smoke.
- Run a live COM9 STATUS check after configuration; acceptance requires `mode=hid hid_key=configured`.
