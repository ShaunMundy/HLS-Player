import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = dirname(scriptPath);

export function ensureClean(root) {
  const result = spawnSync(
    "git",
    ["status", "--porcelain=v1", "--untracked-files=all"],
    { cwd: root, encoding: "utf8" }
  );

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);

  const changes = result.stdout.trim();
  if (!changes) return;

  console.error("Refusing release from a dirty Git worktree:");
  console.error(changes);
  process.exit(1);
}

if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  ensureClean(resolve(scriptDir, ".."));
  console.log("Git worktree is clean.");
}
