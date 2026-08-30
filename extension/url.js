(() => {
  function isHlsNavigation(url) {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) return false;
      return parsed.pathname.toLowerCase().endsWith(".m3u8");
    } catch {
      return false;
    }
  }

  globalThis.HlsPlayerUrl = Object.freeze({ isHlsNavigation });
})();
