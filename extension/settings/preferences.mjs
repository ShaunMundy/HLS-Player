export const DISPLAY_MODES = Object.freeze([
  "fill",
  "best-fit",
  "original",
  "native",
  "16-9",
  "4-3",
]);

const DISPLAY_MODE_SET = new Set(DISPLAY_MODES);

export const DEFAULT_SETTINGS = Object.freeze({
  seamless: false,
  showControls: true,
  displayMode: "best-fit",
});

export function normalizeSettings(value = {}) {
  return {
    seamless: value.seamless === true,
    showControls: value.showControls !== false,
    displayMode: DISPLAY_MODE_SET.has(value.displayMode) ? value.displayMode : DEFAULT_SETTINGS.displayMode,
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
