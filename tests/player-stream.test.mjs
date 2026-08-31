import test from "node:test";
import assert from "node:assert/strict";
import { parseHlsSource } from "../extension/player/stream.mjs";

test("player accepts valid HLS source URLs", () => {
  const url = "https://example.test/live/camera.m3u8?token=a%2Bb#live";
  assert.equal(parseHlsSource(url), url);
});

test("player rejects invalid or unsafe source URLs", () => {
  assert.equal(parseHlsSource("https://example.test/video.mp4"), null);
  assert.equal(parseHlsSource("file:///tmp/camera.m3u8"), null);
  assert.equal(parseHlsSource("not a URL"), null);
});
