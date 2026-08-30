# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Initial public-project scaffold.
- Automatic interception of top-level `.m3u8` navigations.
- Local HLS playback using bundled hls.js.
- Native video controls and basic fatal-error recovery.
- Explicit declaration that the extension collects no data.
- AMO listing metadata and a reproducible listed-signing command.
- A dedicated extension icon.
- Production dependency auditing in CI.

### Changed
- Restricted HLS interception explicitly to HTTP and HTTPS URLs.
- Expanded URL-classification tests for protocol and lookalike edge cases.
- Added direct tests for player redirects, including preservation of signed/query-bearing stream URLs.
- Mozilla lint warnings now fail CI.
- Minimum supported Firefox version remains 142 to satisfy current Mozilla cross-platform linting for the data-collection declaration.
