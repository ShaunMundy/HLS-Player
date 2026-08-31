import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "..");
const packageRoot = resolve(root, "node_modules", "hls.js");
const targetDir = resolve(root, "extension", "vendor");

await mkdir(targetDir, { recursive: true });
await copyFile(resolve(packageRoot, "dist", "hls.min.js"), resolve(targetDir, "hls.min.js"));
await copyFile(resolve(packageRoot, "dist", "hls.worker.js"), resolve(targetDir, "hls.worker.js"));
await copyFile(resolve(packageRoot, "LICENSE"), resolve(targetDir, "LICENSE-hls.txt"));
console.log(`Vendored hls.js, worker, and license -> ${targetDir}`);
