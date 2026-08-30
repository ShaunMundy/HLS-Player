import test from "node:test";
import assert from "node:assert/strict";

await import("../extension/url.js");
const { isHlsNavigation } = globalThis.HlsPlayerUrl;

test("recognizes HTTP and HTTPS HLS playlist paths", () => {
  assert.equal(isHlsNavigation("https://example.com/live/playlist.m3u8"), true);
  assert.equal(isHlsNavigation("http://example.com/live/playlist.m3u8"), true);
  assert.equal(isHlsNavigation("https://example.com/live/PLAYLIST.M3U8?token=abc#live"), true);
});

test("does not treat ordinary or lookalike URLs as HLS", () => {
  assert.equal(isHlsNavigation("https://example.com/video.mp4"), false);
  assert.equal(isHlsNavigation("https://example.com/?file=playlist.m3u8"), false);
  assert.equal(isHlsNavigation("https://example.com/playlist.m3u8/segment.ts"), false);
  assert.equal(isHlsNavigation("not a url"), false);
});

test("rejects non-HTTP protocols", () => {
  assert.equal(isHlsNavigation("ftp://example.com/live/playlist.m3u8"), false);
  assert.equal(isHlsNavigation("file:///tmp/playlist.m3u8"), false);
});
