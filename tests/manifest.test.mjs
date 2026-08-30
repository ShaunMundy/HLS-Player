import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const manifest = JSON.parse(
  await readFile(new URL("../extension/manifest.json", import.meta.url), "utf8")
);

test("package and extension versions stay in sync", () => {
  assert.equal(manifest.version, packageJson.version);
});

test("release metadata keeps the stable extension identity", () => {
  assert.equal(manifest.name, "HLS Player");
  assert.equal(manifest.browser_specific_settings.gecko.id, "hls-player@coco-mundy.fr");
});
