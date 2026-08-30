function redirectHlsNavigation(details) {
  if (details.tabId < 0 || !HlsPlayerUrl.isHlsNavigation(details.url)) {
    return {};
  }

  const playerUrl = new URL(browser.runtime.getURL("player/player.html"));
  playerUrl.searchParams.set("src", details.url);
  return { redirectUrl: playerUrl.href };
}

browser.webRequest.onBeforeRequest.addListener(
  redirectHlsNavigation,
  { urls: ["http://*/*", "https://*/*"], types: ["main_frame"] },
  ["blocking"]
);
