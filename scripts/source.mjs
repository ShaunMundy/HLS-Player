import { spawnSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "..");
const distDir = resolve(root, "dist");
const output = resolve(distDir, "source.zip");

await mkdir(distDir, { recursive: true });

const result = spawnSync(
  "git",
  ["archive", "--format=zip", `--output=${output}`, "HEAD"],
  { cwd: root, stdio: "inherit" }
);

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

console.log(`Source archive -> ${output}`);
