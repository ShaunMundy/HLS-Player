import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

test("vendoring produces all runtime files without dirtying the worktree", () => {
  const vendor = spawnSync(process.execPath, ["scripts/vendor.mjs"], {
    cwd: root,
    encoding: "utf8"
  });

  assert.equal(vendor.status, 0, vendor.stderr || vendor.stdout);
  assert.equal(existsSync(resolve(root, "extension/vendor/hls.min.js")), true);
  assert.equal(existsSync(resolve(root, "extension/vendor/hls.worker.js")), true);
  assert.equal(existsSync(resolve(root, "extension/vendor/LICENSE-hls.txt")), true);

  const status = spawnSync(
    "git",
    ["status", "--porcelain=v1", "--untracked-files=all"],
    { cwd: root, encoding: "utf8" }
  );

  assert.equal(status.status, 0, status.stderr);
  assert.equal(status.stdout.trim(), "");
});
