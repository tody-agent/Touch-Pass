# Design: TouchPass Desktop v0.2.0 Public Release

## Context & Technical Approach

TouchPass Desktop v0.1.0 is published, but the current desktop work adds secure unified-firmware HID provisioning, recovery-safe pairing keys, a redesigned workspace, and vi/en/zh-CN support. The release must distribute installable artifacts for Windows, macOS, and Linux.

The selected approach is a semver minor release, `v0.2.0`, built by GitHub Actions from a merged release branch. Windows produces NSIS and portable assets; macOS is built separately for Apple Silicon and Intel; Linux produces deb, AppImage, and standalone assets. The release workflow collects all artifacts and SHA-256 checksums before publishing.

## Assumptions

- Verified: GitHub account `tody-agent` is authenticated for `tody-agent/Touch-Pass` with `repo` and `workflow` scopes.
- Verified: the default branch is `main`; current desktop release is `v0.1.0`.
- Assumed: `v0.2.0` is the intended version because this is a backwards-compatible feature release before 1.0.
- Explicit limit: macOS artifacts are unsigned; Gatekeeper instructions must be documented and no notarization claim is made.

## Proposed Changes

### Version and release automation

- Bump the Tauri, Cargo, npm, and lockfile package versions to `0.2.0`.
- Build macOS Intel and Apple Silicon as separate workflow jobs; name staged assets uniquely.
- Publish a GitHub Release from tag `v0.2.0` only after all Windows, macOS, and Linux jobs finish.

### Documentation

- Add a root changelog covering the desktop release.
- Update README download/install content to point to the versioned GitHub Release rather than stale v0.1.0 asset names.
- Add English and Vietnamese desktop installation and first-use guides, including the authenticated Configure HID flow and unsigned macOS guidance.

### Delivery flow

1. Create a branch from current `main`, commit the reviewed release changes, and open a PR.
2. Merge the PR after GitHub checks pass.
3. Tag the merged commit as `v0.2.0`, push the tag, and monitor the release workflow.
4. Verify the published release contains Windows, macOS (both architectures), Linux, and checksums assets.

## Verification

- Gate 0 secret hygiene passes; Snyk/Aikido availability is recorded.
- Frontend gate, Rust fmt/clippy/tests, firmware contract tests, and local NSIS build pass.
- GitHub PR checks are green before merge.
- GitHub Release assets include every platform class and `checksums.txt`.
