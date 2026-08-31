# HLS Player

HLS Player is a small browser extension that plays HTTP Live Streaming (`.m3u8`) URLs directly in a local video player.

The project is intentionally narrow: no analytics, no accounts, no native host, no remote code, and no external service operated by the developer.

## What it does

When a top-level HTTP or HTTPS navigation points to a URL whose path ends in `.m3u8`, the extension redirects that navigation to its bundled player page. Playback uses the browser's native HLS implementation when available and otherwise uses the bundled `hls.js` library.

The toolbar popup provides two persistent local preferences: **Seamless mode** removes the player page chrome so only the video remains, and **Show video controls** toggles Firefox's native playback controls. Changes apply immediately to open player tabs.

## Permissions

HLS Player requests access to HTTP and HTTPS URLs because it must see top-level navigation requests before the browser turns an HLS playlist into a download. The extension only reacts to top-level URLs whose path ends in `.m3u8`.

`webRequest` and `webRequestBlocking` are used only to redirect those HLS navigations to the local player page.

The extension declares that it collects no data. Seamless mode and the native-controls preference are stored only in `browser.storage.local` and are not synchronized.

## Compatibility

Desktop Firefox 140 and later is supported. Firefox for Android requires 142 or later. Firefox continues to support blocking `webRequest` handlers in Manifest V3.

## Development

Build environment for the submitted 0.2.0 release:

- Operating system: Windows 11, macOS, or Linux; no platform-specific build tools are required.
- Reproduction environment used for this submission: Windows 11.
- Node.js: 24.19.0
- npm: 11.17.0
- Dependency versions are locked by package-lock.json (hls.js 1.7.1 and web-ext 10.6.0).

Install the exact locked dependency set:

```text
npm ci
```

Run tests:

```text
npm test
```

Run Mozilla's extension linter with warnings treated as errors:

```text
npm run lint
```

Build the XPI-compatible ZIP artifact:

```text
npm run build
```

Build the human-readable reviewer source archive:

```text
npm run source
```

The extension build copies the exact pinned `hls.js` distribution from `node_modules` into the package. The source archive is created directly from the current Git commit and contains the lockfile and build scripts needed to reproduce that vendored dependency.

## Signing and publishing

Create AMO API credentials in the Mozilla Developer Hub and expose them to `web-ext` as `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET`. Do not store those credentials in this repository.

The signed 0.1.0 build completed the first real Firefox end-to-end installation test.

For each subsequent release, run the full release checks and submit the listed build with:

```text
npm run sign:listed
```

The listed command generates the reviewer source archive, vendors the pinned `hls.js` build, and submits both the extension and its AMO metadata. Public availability is subject to Mozilla's review process.

## Test streams

Development smoke tests include public HLS streams listed at `https://coco-mundy.fr/cams/`, notably Foce Sisto and Salto di Fondi when those cameras are online.

## Privacy

See [PRIVACY.md](PRIVACY.md).

## License

MIT. The bundled `hls.js` dependency is licensed under Apache-2.0.
