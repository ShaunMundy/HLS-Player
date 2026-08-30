# HLS Player

HLS Player is a small browser extension that plays HTTP Live Streaming (`.m3u8`) URLs directly in a local video player.

The project is intentionally narrow: no analytics, no accounts, no native host, no remote code, and no external service operated by the developer.

## What it does

When a top-level HTTP or HTTPS navigation points to a URL whose path ends in `.m3u8`, the extension redirects that navigation to its bundled player page. Playback uses the browser's native HLS implementation when available and otherwise uses the bundled `hls.js` library.

## Permissions

HLS Player requests access to HTTP and HTTPS URLs because it must see top-level navigation requests before the browser turns an HLS playlist into a download. The extension only reacts to top-level URLs whose path ends in `.m3u8`.

`webRequest` and `webRequestBlocking` are used only to redirect those HLS navigations to the local player page.

The extension declares that it collects no data.

## Development

Requirements:

- Node.js 24 or compatible current LTS
- npm

Install dependencies:

```text
npm install
```

Run tests:

```text
npm test
```

Run Mozilla's extension linter:

```text
npm run lint
```

Build the XPI-compatible ZIP artifact:

```text
npm run build
```

The build copies the exact pinned `hls.js` distribution from `node_modules` into the extension package before running `web-ext build`.

## Test streams

Development smoke tests include public HLS streams listed at `https://coco-mundy.fr/cams/`, notably Foce Sisto and Salto di Fondi when those cameras are online.

## Privacy

See [PRIVACY.md](PRIVACY.md).

## License

MIT. The bundled `hls.js` dependency is licensed under Apache-2.0.
