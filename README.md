# HLS Player

HLS Player is a small browser extension that plays HTTP Live Streaming (`.m3u8`) URLs directly in a local video player.

The project is intentionally narrow: no analytics, no accounts, no native host, no remote code, and no external service operated by the developer.

## What it does

When a top-level HTTP or HTTPS navigation points to a URL whose path ends in `.m3u8`, the extension redirects that navigation to its bundled player page. Playback uses the browser's native HLS implementation when available and otherwise uses the bundled `hls.js` library.

## Permissions

HLS Player requests access to HTTP and HTTPS URLs because it must see top-level navigation requests before the browser turns an HLS playlist into a download. The extension only reacts to top-level URLs whose path ends in `.m3u8`.

`webRequest` and `webRequestBlocking` are used only to redirect those HLS navigations to the local player page.

The extension declares that it collects no data.

## Compatibility

The extension targets Firefox 142 and later. Firefox continues to support blocking `webRequest` handlers in Manifest V3.

## Development

Requirements:

- Node.js 22 or later
- npm

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

The build copies the exact pinned `hls.js` distribution from `node_modules` into the extension package before running `web-ext build`.

## Signing and publishing

Create AMO API credentials in the Mozilla Developer Hub and expose them to `web-ext` as `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET`. Do not store those credentials in this repository.

Before the first public listing, create a signed self-distribution build for the real Firefox installation test:

```text
npm run sign:unlisted
```

Install the resulting signed XPI in Firefox and verify the full user path: open the camera list, click a `.m3u8` stream, confirm that no download dialog appears, and confirm that the bundled HLS player opens and plays the stream.

Only after that end-to-end test succeeds should version 0.1.0 be submitted for public listing. The repository contains `amo-metadata.json` with the metadata required for that first listed submission:

```text
npm run sign:listed
```

The listed command vendors the pinned `hls.js` build and submits the extension with the repository's AMO metadata. Public availability is subject to Mozilla's review process.

## Test streams

Development smoke tests include public HLS streams listed at `https://coco-mundy.fr/cams/`, notably Foce Sisto and Salto di Fondi when those cameras are online.

## Privacy

See [PRIVACY.md](PRIVACY.md).

## License

MIT. The bundled `hls.js` dependency is licensed under Apache-2.0.
