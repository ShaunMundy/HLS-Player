export const DEFAULT_SETTINGS = Object.freeze({
  seamless: false,
  showControls: true,
});

export function normalizeSettings(value = {}) {
  return {
    seamless: value.seamless === true,
    showControls: value.showControls !== false,
  };
}

export async function loadSettings(storageArea = globalThis.browser?.storage?.local) {
  if (!storageArea) return { ...DEFAULT_SETTINGS };
  const stored = await storageArea.get(DEFAULT_SETTINGS);
  return normalizeSettings(stored);
}

export async function saveSettings(settings, storageArea = globalThis.browser?.storage?.local) {
  const normalized = normalizeSettings(settings);
  if (storageArea) await storageArea.set(normalized);
  return normalized;
}
