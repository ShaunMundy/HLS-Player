import test from "node:test";
import assert from "node:assert/strict";

await import("../extension/url.js");
const { isHlsNavigation, getHlsRedirect } = globalThis.HlsPlayerUrl;

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

test("builds a player redirect that preserves the complete source URL", () => {
  const source = "https://example.com/live/playlist.m3u8?token=a%2Bb&name=hello%20world#live";
  const result = getHlsRedirect(
    { tabId: 7, url: source },
    "moz-extension://example/player/player.html"
  );

  const redirect = new URL(result.redirectUrl);
  assert.equal(redirect.protocol, "moz-extension:");
  assert.equal(redirect.pathname, "/player/player.html");
  assert.equal(redirect.searchParams.get("src"), source);
});

test("does not redirect background requests or non-HLS navigations", () => {
  const playerPage = "moz-extension://example/player/player.html";

  assert.deepEqual(
    getHlsRedirect(
      { tabId: -1, url: "https://example.com/live/playlist.m3u8" },
      playerPage
    ),
    {}
  );
  assert.deepEqual(
    getHlsRedirect({ tabId: 4, url: "https://example.com/video.mp4" }, playerPage),
    {}
  );
});
