# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2026-08-31

### Added
- Persistent Seamless mode for borderless in-page video playback.
- A persistent setting to show or hide Firefox's native video controls.
- A toolbar settings popup backed only by `browser.storage.local`.
- The dedicated HLS Player icon in standard extension sizes.

### Changed
- Successful playback status messages now disappear automatically.
- In Seamless mode, loading and error status is shown as a small video overlay.
- Clicking the video toggles playback when native controls are hidden.

## [0.1.0] - 2026-08-31

### Added
- Automatic interception of top-level `.m3u8` navigations.
- Local HLS playback using bundled hls.js.
- Native video controls and basic fatal-error recovery.
- Explicit declaration that the extension collects no data.
- Reproducible AMO signing and release checks.
