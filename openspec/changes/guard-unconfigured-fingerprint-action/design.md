# Design: Guard Unconfigured Fingerprint Actions

## Context & Technical Approach

The unified firmware currently types the fixed PIV dummy PIN `000000` after
every successful fingerprint match, even when `piv_uses_provisioned_keys()` is
false. A fresh device therefore appears to perform an action although STATUS
correctly reports `keys=unconfigured`.

The firmware will gate action dispatch on the selected mode's provisioning
state. An unconfigured match will emit an asynchronous
`EV UNCONFIGURED slot=<n> score=<n> mode=<mode> reason=<reason>` line, flash the
ZW101 aura yellow, and send no keyboard report. Normal successful actions flash
green, failures flash red, and the idle color remains blue.

## Proposed Changes

### `touch_pin_hid.c`

- Check the HID pairing key before requesting a desktop action.
- Check provisioned PIV keys before noting user presence or typing the dummy PIN.
- Emit the unconfigured event with the real slot and score.
- Route success/failure/unconfigured outcomes to the fingerprint LED API.

### `fingerprint.c` / `fingerprint.h`

- Add public action-result and unconfigured LED helpers protected by the UART
  mutex.
- Use yellow (red + green) for unconfigured state.
- Defer the background-match success color until the selected action succeeds.

### Firmware contract tests

- Prove unconfigured PIV cannot reach `type_dummy_pin()`.
- Prove the event includes real slot/score and mode/reason.
- Prove yellow/green/red/blue feedback remains available.

## Assumptions

- `000000` remains required for fully provisioned PIV login and must not be
  removed from that configured path.
- Per-slot desktop actions remain desktop-owned; this change covers missing
  device-level PIV keys or HID pairing key.
- The ZW101 aura color values are bit flags, so yellow is red OR green.

## Verification

- Observe the new contract tests fail before production changes and pass after.
- Run the full repository test suite and `git diff --check`.
- Build the unified firmware with ESP-IDF 5.3.3.
- On hardware with `mode=piv keys=unconfigured`, touch an enrolled finger and
  verify no `000000`, one `EV UNCONFIGURED`, and a yellow flash returning blue.

