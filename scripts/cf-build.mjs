#!/usr/bin/env node
/**
 * Cloudflare Workers (OpenNext) build wrapper.
 *
 * The Vercel build uses Cache Components, and a few dynamic routes export
 * `instant = false` (a Cache Components-only segment config). The Workers
 * build turns Cache Components off (see next.config.ts), and Next refuses
 * `instant` without it. So for the Workers build only, this script comments
 * those exports out, runs `opennextjs-cloudflare build`, and always restores
 * the files afterwards. Vercel builds and the committed source are untouched.
 */
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const APP = join(ROOT, "src/app");
const PATTERN = /^export const instant = false;$/m;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/^(page|layout)\.(t|j)sx?$/.test(name)) out.push(p);
  }
  return out;
}

const originals = new Map();
for (const file of walk(APP)) {
  const src = readFileSync(file, "utf8");
  if (PATTERN.test(src)) {
    originals.set(file, src);
    writeFileSync(file, src.replace(PATTERN, "// [cf-build] export const instant = false;"));
  }
}

const restore = () => {
  for (const [file, src] of originals) writeFileSync(file, src);
  originals.clear();
};
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => { restore(); process.exit(130); });

let status = 1;
try {
  const res = spawnSync("npx", ["opennextjs-cloudflare", "build", ...process.argv.slice(2)], {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, NEXT_PUBLIC_DEPLOY_TARGET: "cloudflare" },
  });
  status = res.status ?? 1;
} finally {
  restore();
}
process.exit(status);
