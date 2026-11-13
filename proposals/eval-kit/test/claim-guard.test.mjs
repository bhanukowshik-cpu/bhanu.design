import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfig, scan } from '../src/claim-guard.mjs';

test('the example copy passes', async () => {
  const cfg = await loadConfig('examples/claims.config.json');
  assert.deepEqual(await scan(cfg), []);
});

test('an overclaim fails the build', async () => {
  const root = await mkdtemp(join(tmpdir(), 'claims-'));
  await mkdir(join(root, 'examples/copy'), { recursive: true });
  await writeFile(join(root, 'examples/copy/hero.tsx'), '<h1>Deepfake-proof interviews.</h1>\n<p>We catch every cheater.</p>');
  const cfg = await loadConfig('examples/claims.config.json');
  const v = await scan(cfg, root);
  assert.equal(v.length, 2);
  assert.equal(v[0].line, 1);
  await rm(root, { recursive: true });
});
