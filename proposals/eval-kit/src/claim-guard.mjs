#!/usr/bin/env node
/**
 * The copy is tested too.
 *
 * A detector can be honest in its lab report and still overclaim on its own screens. This guard fails the build if
 * product copy says more than the tests support, e.g. "deepfake-proof" or "you're a verified human". It is a copy
 * guard, not a security control and not a substitute for validation.
 *
 * Verified Call runs this in CI as `claims:check`. Config: a JSON file with the folders to scan and the phrases that
 * are not allowed (regular expressions). See examples/claims.config.json.
 *
 *   node src/claim-guard.mjs examples/claims.config.json
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function loadConfig(path) {
  const cfg = JSON.parse(await readFile(path, 'utf8'));
  return {
    surfaces: cfg.surfaces,
    extensions: new RegExp(`\\.(?:${(cfg.extensions || ['tsx', 'ts', 'jsx', 'js', 'mdx', 'html']).join('|')})$`, 'u'),
    forbidden: cfg.forbidden.map((f) => ({ pattern: new RegExp(f.pattern, 'iu'), why: f.why || '' })),
  };
}

/** Returns every line in the surfaces that makes a forbidden claim. */
export async function scan(cfg, root = process.cwd()) {
  const violations = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const child = join(dir, entry.name);
      if (entry.isDirectory()) { if (entry.name !== 'node_modules') await walk(child); }
      else if (entry.isFile() && cfg.extensions.test(entry.name)) {
        (await readFile(child, 'utf8')).split('\n').forEach((line, i) => {
          for (const f of cfg.forbidden) {
            if (f.pattern.test(line)) violations.push({ file: relative(root, child), line: i + 1, text: line.trim(), why: f.why });
          }
        });
      }
    }
  }
  for (const s of cfg.surfaces) await walk(join(root, s));
  return violations;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cfg = await loadConfig(process.argv[2] || 'claims.config.json');
  const v = await scan(cfg);
  if (v.length) {
    console.error('Unsupported claims found:');
    for (const x of v) console.error(`- ${x.file}:${x.line}: ${x.text}${x.why ? `  (${x.why})` : ''}`);
    process.exitCode = 1;
  } else {
    console.log('Claim guard passed.');
  }
}
