// `npm run typecheck`: generate Next route types, then run tsc.
// next.config.ts validates the server env at boot (fail fast for dev/build/start). Type
// generation needs no secrets, so this is the ONLY caller that opts out, via
// SKIP_ENV_VALIDATION. Set from Node (not the npm script) so it works on Windows and POSIX.
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const env = { ...process.env, SKIP_ENV_VALIDATION: "1" };

// tsconfig includes the generated route types. Stale ones (e.g. a validator.ts left by
// `next dev` before a route moved) break tsc, so regenerate them from scratch every time.
for (const generated of [".next/dev/types", ".next/types"]) {
  rmSync(new URL(`../${generated}`, import.meta.url), { recursive: true, force: true });
}
const steps = [
  ["node_modules/next/dist/bin/next", "typegen"],
  ["node_modules/typescript/bin/tsc", "--noEmit"],
];

for (const [bin, ...args] of steps) {
  const { status } = spawnSync(process.execPath, [bin, ...args], { cwd: root, stdio: "inherit", env });
  if (status !== 0) process.exit(status ?? 1);
}
