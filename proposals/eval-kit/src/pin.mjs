#!/usr/bin/env node
/**
 * Rules before results.
 *
 * Before a test runs, every file that decides pass or fail (rules, thresholds, the scoring code, the test manifest) is
 * fingerprinted with sha256 and the fingerprints are saved. Grading refuses to run if any of those files has changed
 * since. A new idea means a new pinned version, tested again, and the old result stays on record. It is how you stop
 * yourself from tuning the rules after seeing the answers.
 *
 *   node src/pin.mjs freeze examples/rules/*.json > pinned.json   # before the run
 *   node src/pin.mjs verify pinned.json                            # before grading; exits 1 if anything moved
 */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export async function sha256File(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex');
}

/** Fingerprint the given files. Returns a record you save next to the run. */
export async function freeze(paths, { now = new Date() } = {}) {
  if (!paths.length) throw new Error('nothing to pin');
  const files = {};
  for (const p of [...paths].sort()) files[p] = await sha256File(p);
  const id = createHash('sha256').update(JSON.stringify(files)).digest('hex').slice(0, 12);
  return { pinned_at: now.toISOString(), id, files };
}

/** Compare the files on disk with a pinned record. Returns the list of differences (empty means safe to grade). */
export async function diff(record) {
  const changed = [];
  for (const [p, want] of Object.entries(record.files)) {
    let got = null;
    try { got = await sha256File(p); } catch { /* missing file counts as changed */ }
    if (got !== want) changed.push({ file: p, pinned: want, now: got });
  }
  return changed;
}

/** Throws if anything changed; call it at the top of your grader. */
export async function assertPinned(record) {
  const changed = await diff(record);
  if (changed.length) {
    const list = changed.map((c) => `  ${c.file}: ${c.now ? 'changed' : 'missing'}`).join('\n');
    throw new Error(`rules changed since they were pinned (${record.id}):\n${list}\nPin a new version and test again.`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, ...args] = process.argv.slice(2);
  try {
    if (cmd === 'freeze') process.stdout.write(JSON.stringify(await freeze(args), null, 2) + '\n');
    else if (cmd === 'verify') {
      const record = JSON.parse(await readFile(args[0], 'utf8'));
      await assertPinned(record);
      console.log(`Pinned rules ${record.id} unchanged; safe to grade.`);
    } else {
      console.error('usage: pin.mjs freeze <files...> | pin.mjs verify <pinned.json>');
      process.exitCode = 2;
    }
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
