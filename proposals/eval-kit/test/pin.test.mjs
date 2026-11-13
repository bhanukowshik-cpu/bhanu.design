import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { freeze, diff, assertPinned } from '../src/pin.mjs';

test('pinned rules pass until a rule file changes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'pin-'));
  const rule = join(dir, 'rule.json');
  await writeFile(rule, '{"threshold": 0.8}');
  const record = await freeze([rule]);
  assert.deepEqual(await diff(record), []);
  await assertPinned(record);

  await writeFile(rule, '{"threshold": 0.7}'); // "just one small tweak" after seeing results
  const changed = await diff(record);
  assert.equal(changed.length, 1);
  await assert.rejects(assertPinned(record), /changed since they were pinned/);
  await rm(dir, { recursive: true });
});

test('a deleted rule file also blocks grading', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'pin-'));
  const rule = join(dir, 'rule.json');
  await writeFile(rule, '{}');
  const record = await freeze([rule]);
  await rm(rule);
  await assert.rejects(assertPinned(record), /missing/);
  await rm(dir, { recursive: true });
});
