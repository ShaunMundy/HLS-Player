# Changelog

All notable changes to this project will be documented in this file.

## [0.3.5] - 2026-10-30

### Changed
- Replace the double-ring stream-info button with a centered single-ring SVG icon and no visible outer button border.
- Close the stream-information overlay when clicking outside the panel, including the player background.
- Consume the first outside click on the video so dismissing the overlay does not accidentally pause playback.
- Keep keyboard focus indication for the info button and existing I/Escape shortcuts.

## [0.3.4] - 2026-10-30

### Changed
- Remove the transient "LAST" label from the network activity readout.
- Smooth the historical throughput line at 500 ms rendering intervals between genuine fragment measurements.
- Keep the preceding fragment sample for seamless clipping at the left edge of the 30-second chart.
- Place the "30 seconds" time-range caption at the lower right.
- Preserve the dashed hold-last-measurement extension without reporting interpolated points as data.

## [0.3.3] - 2026-10-30

### Changed
- Show the last measured throughput in the chart header instead of the peak.
- Extend the last measurement with a dashed line until the 30-second history expires.
- Use a finer chart stroke and a simple "30 seconds" caption.
- Shorten and visually separate the playlist metadata footnote.

## [0.3.2] - 2026-10-30

### Added
- Live 30-second throughput sparkline in the stream information overlay.
- Session download total for HLS media fragments.
- Regression tests for fragment loader statistics and sparkline history.

### Fixed
- Read hls.js fragment and low-latency part load statistics for throughput measurement.

### Changed
- More translucent stream information panel with a restrained frosted-glass treatment.

## [0.3.1] - 2026-10-30

### Added
- Live stream information overlay with codec, frame rate, HLS and playback diagnostics.

## [0.3.0] - 2026-09-16

### Added
- Display / Ratio modes: Fill, Best fit, Original, Native, 16:9, and 4:3.

### Changed
- The settings popup now follows Firefox's preferred light/dark colour scheme.
- Reduced popup dimensions and spacing for a denser settings layout.

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
