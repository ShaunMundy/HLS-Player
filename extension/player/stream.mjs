export function parseHlsSource(value) {
  if (!value) return null;

  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    if (!parsed.pathname.toLowerCase().endsWith(".m3u8")) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

export function getWorkerPath() {
  if (globalThis.browser?.runtime?.getURL) {
    return browser.runtime.getURL("vendor/hls.worker.js");
  }
  return "../vendor/hls.worker.js";
}
