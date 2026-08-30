import test from "node:test";
import assert from "node:assert/strict";

await import("../extension/url.js");
const { isHlsNavigation } = globalThis.HlsPlayerUrl;

test("recognizes HLS playlist paths", () => {
  assert.equal(isHlsNavigation("https://example.com/live/playlist.m3u8"), true);
  assert.equal(isHlsNavigation("https://example.com/live/PLAYLIST.M3U8?token=abc"), true);
});

test("does not treat ordinary URLs as HLS", () => {
  assert.equal(isHlsNavigation("https://example.com/video.mp4"), false);
  assert.equal(isHlsNavigation("https://example.com/?file=playlist.m3u8"), false);
  assert.equal(isHlsNavigation("not a url"), false);
});
