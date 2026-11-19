# ChangedAnswer

An answer that remembers what it used to be. When a source file is replaced, the new answer lands on top, and the old one stays visible underneath with the date it stopped being true.

Free to use (MIT). Unsolicited concept, not affiliated with Graphon. Demo data is made up.

## Use

Copy `ChangedAnswer.tsx` and `changed-answer.css` into your React 18+ app. There are no dependencies.

```tsx
import { ChangedAnswer } from "./ChangedAnswer";

<ChangedAnswer
  question="Who maintains Signal 14?"
  current={{ fact: "Arclight Signals", since: "2026-11-03", source: { name: "service-contract.txt", version: "v2" } }}
  previous={{ fact: "Northgate Signals", since: "2026-03-01", source: { name: "service-contract.txt", version: "v1" } }}
>
  {(fact) => <>{fact} maintains it.</>}
</ChangedAnswer>
```

| Prop | Type | Notes |
|---|---|---|
| `question` | `string` | Shown above the answer, and labels the section. |
| `current` | `AnswerVersion` | `{ fact, since (ISO date), source: { name, version?, href? } }` |
| `previous` | `AnswerVersion?` | Omit when nothing changed. Adds the "Changed" chip and the card underneath. |
| `children` | `(fact) => ReactNode` | The sentence around the fact. Defaults to the fact alone. |
| `animateOnMount` | `boolean` | Default `false`. The change animates whenever `current` changes while mounted. |
| `locale` | `string` | Date locale. Dates are read as calendar days in UTC, so they never shift by a day. |
| `labels` | `Partial<ChangedAnswerLabels>` | Override any text, for translation. |

## Behaviour

- The current answer comes first in reading order, and the change is announced through a polite live region.
- Dates use `<time dateTime>`.
- With `prefers-reduced-motion`, nothing moves and the final layout is the same.
- To theme it, override the `--ca-*` custom properties (top of `changed-answer.css`), for example a dark card for a dark app.

## Rebuild the demo

`demo.tsx` is bundled into `demo.js` and `demo.css` for `graphon.html` (classic script, so it also runs from file://):

```bash
npx esbuild demo.tsx --bundle --minify --jsx=automatic --format=iife --target=es2020 --define:process.env.NODE_ENV='"production"' --outfile=demo.js
```

It needs `react` and `react-dom` 18 installed where esbuild can resolve them. Type-checked with `tsc --strict`.
