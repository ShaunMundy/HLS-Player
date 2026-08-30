(() => {
  function isHlsNavigation(url) {
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) return false;
      return parsed.pathname.toLowerCase().endsWith(".m3u8");
    } catch {
      return false;
    }
  }

  function getHlsRedirect(details, playerPageUrl) {
    if (details.tabId < 0 || !isHlsNavigation(details.url)) {
      return {};
    }

    const playerUrl = new URL(playerPageUrl);
    playerUrl.searchParams.set("src", details.url);
    return { redirectUrl: playerUrl.href };
  }

  globalThis.HlsPlayerUrl = Object.freeze({ isHlsNavigation, getHlsRedirect });
})();
