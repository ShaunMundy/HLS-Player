(() => {
  function isHlsNavigation(url) {
    try {
      const parsed = new URL(url);
      return parsed.pathname.toLowerCase().endsWith(".m3u8");
    } catch {
      return false;
    }
  }

  globalThis.HlsPlayerUrl = Object.freeze({ isHlsNavigation });
})();
