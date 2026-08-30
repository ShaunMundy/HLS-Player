function redirectHlsNavigation(details) {
  return HlsPlayerUrl.getHlsRedirect(
    details,
    browser.runtime.getURL("player/player.html")
  );
}

browser.webRequest.onBeforeRequest.addListener(
  redirectHlsNavigation,
  { urls: ["http://*/*", "https://*/*"], types: ["main_frame"] },
  ["blocking"]
);
