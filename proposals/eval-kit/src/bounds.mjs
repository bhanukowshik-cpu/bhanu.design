/**
 * Honest statistics for small detection tests.
 *
 * "30 of 30 caught" is not "100% accurate". With 30 tries, the most you can say at 95% confidence is that the true
 * catch rate is at least ~90.5%. clopperLower() gives that number exactly (the Clopper-Pearson one-sided bound), and
 * trialsFor() answers the planning question: how many clean tries do I need before I may claim a rate at all?
 *
 * Verified Call publishes every result with this bound beside it, and only claims "at least 90%" for an attack
 * family after 29 clean tries.
 */

/** P(X <= k) for X ~ Binomial(n, p), summed in log space so large n stays stable. */
export function binomCdf(k, n, p) {
  if (k < 0) return 0;
  if (k >= n) return 1;
  if (p <= 0) return 1;
  if (p >= 1) return 0;
  let logTerm = n * Math.log1p(-p); // log P(X = 0)
  let sum = Math.exp(logTerm);
  for (let i = 1; i <= k; i++) {
    logTerm += Math.log((n - i + 1) / i) + Math.log(p) - Math.log1p(-p);
    sum += Math.exp(logTerm);
  }
  return Math.min(1, sum);
}

/**
 * Exact one-sided lower confidence bound for a success rate (Clopper-Pearson).
 * k successes out of n tries; confidence 1 - alpha (default 95%).
 * Returns the smallest true rate that is still consistent with what you saw.
 */
export function clopperLower(k, n, alpha = 0.05) {
  check(k, n, alpha);
  if (n === 0) return null;
  if (k === 0) return 0;
  if (k === n) return Math.pow(alpha, 1 / n); // closed form when every try succeeded
  // The bound is the p where P(X >= k | p) = alpha, i.e. 1 - binomCdf(k - 1, n, p) = alpha. Bisection: monotone in p.
  let lo = 0, hi = k / n;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (1 - binomCdf(k - 1, n, mid) < alpha) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * How many tries, all succeeding, before the lower bound reaches `target`?
 * trialsFor(0.90) === 29: the rule behind "29 tries per attack family before claiming 90%".
 */
export function trialsFor(target, alpha = 0.05) {
  if (!(target > 0 && target < 1)) throw new RangeError('target must be between 0 and 1');
  return Math.ceil(Math.log(alpha) / Math.log(target));
}

/** One line a person can read, e.g. "30 of 30 (at least 90.5% at 95% confidence)". */
export function describe(k, n, alpha = 0.05) {
  const lb = clopperLower(k, n, alpha);
  const pct = (x) => `${(Math.floor(x * 1000) / 10).toFixed(1)}%`; // round down: never overstate
  return `${k} of ${n} (at least ${pct(lb)} at ${Math.round((1 - alpha) * 100)}% confidence)`;
}

function check(k, n, alpha) {
  if (!Number.isInteger(k) || !Number.isInteger(n) || k < 0 || n < 0 || k > n) throw new RangeError(`bad counts: ${k} of ${n}`);
  if (!(alpha > 0 && alpha < 1)) throw new RangeError('alpha must be between 0 and 1');
}
