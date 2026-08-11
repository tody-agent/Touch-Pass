# Touch Pass Documentation and GitHub Publishing Design

## Goal

Turn the current TinyTouch-derived repository into an approachable English-first
Touch Pass project for curious makers, vibe coders, and first-time hardware
builders. The documentation should make the result feel achievable without
hiding the real security limitations of a USB HID fingerprint device.

Touch Pass remains an attributed fork of
[TinyTouch](https://github.com/ZimengXiong/TinyTouch). The existing Git history
will be preserved.

## Audience

The primary reader:

- is comfortable copying commands but may not understand embedded development;
- enjoys DIY electronics, agents, automation, and vibe coding;
- owns a Mac and wants a practical first ESP32-S3 project;
- benefits from short steps, visible checkpoints, and symptom-based fixes.

The main path covers the ESP32-S3 Super Mini, ZW101, USB HID firmware, macOS
helper, local portal, and ten fingerprint action slots. PIV stays outside the
primary tutorial and is mentioned only as advanced upstream context.

## Information Architecture

### `README.md`

The README acts as the repository landing page rather than a complete manual.
It will contain:

1. the approved hero image and the tagline “Give every finger a superpower”;
2. a plain-language explanation of Touch Pass;
3. a concise feature/use-case overview;
4. the Claude action-confirmation and feature images;
5. a three-step explanation of the hardware-to-Mac flow;
6. a minimal quick start that points to the two detailed guides;
7. a short, prominent security note;
8. project status, requirements, contribution guidance, and upstream credit.

No fake CI, security, certification, or compatibility badges will be used.

### `docs/BUILD_GUIDE.md`

The build guide will take a beginner from parts to a working portal:

1. bill of materials and tools;
2. enclosure and component orientation using the approved exploded image;
3. exact six-pin ZW101 wiring table;
4. Arduino IDE/core and board settings;
5. Python helper environment setup;
6. generation and safe handling of the pairing key;
7. creation of `secrets.h` and firmware upload;
8. portal startup and first-device connection;
9. a staged validation checklist;
10. troubleshooting grouped by observable symptom.

Commands will be copyable, non-destructive, and explicit about the working
directory. Real secrets remain ignored by Git.

### `docs/USER_GUIDE.md`

The user guide will explain day-to-day operation:

1. opening the loopback-only portal;
2. naming and enrolling slots 1–10;
3. configuring Password, Accept, Enter, Escape, and custom macros;
4. one-touch password behavior versus same-finger double touch within three
   seconds for control actions;
5. sample mappings for Mac login, Codex, Claude, and common terminal actions;
6. editing, deleting, and re-enrolling profiles;
7. Keychain behavior, focus/input-layout caveats, and safe usage;
8. troubleshooting and recovery.

The approved login-success and desk-use images will illustrate the flow.

## Image Set

Only images retained by the user under `assets/demo/` will be published:

- `01-hero-showcase-v2.png`
- `02-mac-mini-claude-accept-v2.png`
- `03-login-success.png`
- `04-features.png`
- `05-exploded-view-v3.png`

macOS `.DS_Store` files will not be committed. Markdown will use relative paths
so images render on GitHub and in local clones.

## Tone and Editorial Rules

- English first, friendly, confident, and playful without hype.
- Explain jargon at first use and prefer outcomes over implementation detail.
- Use short sections, checklists, tables, and “what you should see” checkpoints.
- Never claim Touch Pass is equivalent to a secure enclave or commercial
  biometric authenticator.
- Clearly state that HID types into the focused field and that the ZW101 UART
  link is not authenticated.
- Keep the Vietnamese guide and link to it as a community translation.

## Validation

Before publishing:

1. verify all relative Markdown links and referenced images exist;
2. scan tracked files for `.DS_Store`, `secrets.h`, and accidental credentials;
3. run the complete Python test suite;
4. compile the Arduino firmware with a temporary example pairing key;
5. run Python and JavaScript syntax checks;
6. confirm the Git working tree contains only intended documentation and image
   changes.

Physical hardware behavior cannot be proven without the user's assembled
device, so the guides will distinguish automated validation from hardware
checkpoints.

## GitHub Publishing

The authenticated GitHub account is `tody-agent`. Publishing will:

1. create the private repository `tody-agent/Touch-Pass`;
2. preserve the current Git history and attribution;
3. rename the existing TinyTouch remote from `origin` to `upstream`;
4. add the new private repository as `origin`;
5. push the local `main` branch and set its upstream tracking branch;
6. verify repository visibility, default branch, remote configuration, and the
   pushed commit.

No release, package, GitHub Pages site, issue import, or collaborator changes
are included in this scope.
