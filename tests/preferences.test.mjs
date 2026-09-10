import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SETTINGS,
  DISPLAY_MODES,
  normalizeSettings,
  saveSettings,
} from "../extension/settings/preferences.mjs";

test("display modes include all supported sizing choices", () => {
  assert.deepEqual(DISPLAY_MODES, ["fill", "best-fit", "original", "native", "16-9", "4-3"]);
  assert.equal(DEFAULT_SETTINGS.displayMode, "best-fit");
});

test("invalid display modes fall back to best fit", () => {
  assert.equal(normalizeSettings({ displayMode: "nonsense" }).displayMode, "best-fit");
});

test("display mode is persisted with the other player settings", async () => {
  let stored;
  const storage = {
    async set(value) {
      stored = value;
    },
  };

  await saveSettings({ seamless: true, showControls: false, displayMode: "native" }, storage);
  assert.deepEqual(stored, { seamless: true, showControls: false, displayMode: "native" });
});
