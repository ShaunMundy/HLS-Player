import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  normalizeSettings,
  saveSettings,
} from "../extension/settings/preferences.mjs";

test("player preference defaults are conservative", () => {
  assert.deepEqual(DEFAULT_SETTINGS, {
    seamless: false,
    showControls: true,
  });
});

test("stored player preferences are normalized", () => {
  assert.deepEqual(normalizeSettings({ seamless: true, showControls: false }), {
    seamless: true,
    showControls: false,
  });
  assert.deepEqual(normalizeSettings({}), DEFAULT_SETTINGS);
});

test("player preferences round-trip through local storage", async () => {
  let stored = {};
  const storage = {
    async get(defaults) {
      return { ...defaults, ...stored };
    },
    async set(value) {
      stored = { ...value };
    },
  };

  await saveSettings({ seamless: true, showControls: false }, storage);
  assert.deepEqual(await loadSettings(storage), {
    seamless: true,
    showControls: false,
  });
});
