# Verified Call evaluation kit

Three small tools from the evaluation system behind [Verified Call](https://verifiedcall.app), a product that checks
the person on a video interview is on a real camera, stays the same person, and isn't using a hidden AI tool.

A detector graded by the person who built it will flatter itself. So the evaluation was designed before the checks,
and every published number ([verifiedcall.app/research](https://verifiedcall.app/research)) passes through these
three rules. This repo is that layer, on its own. It contains no detection code, thresholds or attack data.

| Tool | The rule it enforces | File |
|---|---|---|
| **Honest statistics** | Report the lowest rate the data supports, not the raw score. 30 of 30 is "at least 90.4%", not "100%". | [`src/bounds.mjs`](src/bounds.mjs) |
| **Rules before results** | Pin the pass/fail rules (sha256) before a test runs; grading refuses to run if they changed. | [`src/pin.mjs`](src/pin.mjs) |
| **The copy is tested too** | The build fails if product copy claims more than the tests support ("deepfake-proof", "verified human"). | [`src/claim-guard.mjs`](src/claim-guard.mjs) |

No dependencies. Node 20 or newer.

```bash
npm test                 # 10 tests
npm run claims:check     # scan example product copy
npm run pin              # fingerprint an example rule file
```

## 1. Honest statistics

```js
import { clopperLower, trialsFor, describe } from './src/bounds.mjs';

describe(30, 30);       // '30 of 30 (at least 90.4% at 95% confidence)'
clopperLower(962, 970); // 0.9852: the real person was cleared 962 of 970 times
trialsFor(0.90);        // 29: clean tries needed before you may claim "at least 90%"
```

`clopperLower` is the exact one-sided Clopper-Pearson bound: the lowest true rate still consistent with what you saw,
at 95% confidence. It is exact, not a normal approximation, because detection tests are small and often perfect, which
is exactly where approximations overstate. `describe` rounds down so a summary never claims more than the bound.

`trialsFor` is the planning side of the same idea. Verified Call does not claim 90% for an attack family until it has
29 clean tries of that family.

## 2. Rules before results

```bash
node src/pin.mjs freeze rules/*.json score.py manifest.jsonl > pinned.json   # before the run
node src/pin.mjs verify pinned.json                                         # before grading
```

```js
import { assertPinned } from './src/pin.mjs';
await assertPinned(JSON.parse(await readFile('pinned.json', 'utf8'))); // throws if any pinned file changed
```

The temptation in any evaluation is a small tweak after seeing the results. Pinning makes that impossible to do
quietly: a changed rule is a new version, tested again, and the failed version stays on record. (Verified Call's camera
rule scored 14 of 17 on one version before it was rewritten; both results are published.)

## 3. The copy is tested too

```bash
node src/claim-guard.mjs examples/claims.config.json
```

The config lists the folders that hold product copy and the phrases that are not allowed, each with the reason:

```json
{ "pattern": "deepfake[ -]?proof", "why": "no detector is proof; tests show a measured rate" }
```

A detector can be honest in its lab report and still overclaim on its own screens. This guard runs in CI next to the
tests, so the words in the product can't drift past the evidence. It is a copy guard, not a security control.

## What this is not

Not the detector. Verified Call's checks, thresholds, test data and red-team material stay private, so this repo can't
be used to probe or evade it. Results, with method, samples, false alarms and dates:
[verifiedcall.app/research](https://verifiedcall.app/research). How the system was designed:
[bhanu.build/verified-call.html#evidence](https://bhanu.build/verified-call.html#evidence).

MIT licensed. Built by [Bhanu Kowshik](https://bhanu.build).
