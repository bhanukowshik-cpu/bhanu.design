import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clopperLower, trialsFor, describe, binomCdf } from '../src/bounds.mjs';

const near = (a, b, eps = 5e-4) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test('all tries succeeded: the published Verified Call figures', () => {
  near(clopperLower(30, 30), 0.9050); // 30 of 30 per hidden AI tool -> at least 90.4% (exact: 0.90497)
  near(clopperLower(29, 29), 0.9019); // 29 of 29 per kind of camera software -> at least 90.1% (exact: 0.90186)
});

test('some failures: the bound sits exactly where P(at least k successes) = 5%', () => {
  for (const [k, n] of [[962, 970], [14, 17], [3, 10]]) {
    const p = clopperLower(k, n);
    near(1 - binomCdf(k - 1, n, p), 0.05, 1e-6);
  }
  near(clopperLower(962, 970), 0.98517, 1e-4); // real person cleared 962 of 970 -> at least 98.5%
  near(clopperLower(14, 17), 0.60436, 1e-4);  // the rule version that failed: 14 of 17
});

test('edge cases', () => {
  assert.equal(clopperLower(0, 10), 0);
  assert.equal(clopperLower(0, 0), null);
  assert.throws(() => clopperLower(5, 3), RangeError);
});

test('29 clean tries before claiming 90%', () => {
  assert.equal(trialsFor(0.90), 29);
  assert.ok(clopperLower(28, 28) < 0.90);
  assert.ok(clopperLower(29, 29) >= 0.90);
});

test('describe never rounds up', () => {
  // the exact bound is 0.90497: shown as 90.4%, not rounded up to 90.5%
  assert.equal(describe(30, 30), '30 of 30 (at least 90.4% at 95% confidence)');
});

test('binomial CDF sanity', () => {
  near(binomCdf(5, 10, 0.5), 0.623046875, 1e-9);
});
