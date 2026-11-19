// Fig. 3 on graphon.html: the real ChangedAnswer component driven by a timeline scrubber.
// Bundled into demo.js / demo.css with esbuild (command in README.md).
import { StrictMode, useEffect, useRef, useState, type ChangeEvent } from "react";
import { createRoot } from "react-dom/client";
import { ChangedAnswer, type AnswerVersion } from "./ChangedAnswer";

const v1: AnswerVersion = {
  fact: "Northgate Signals",
  since: "2026-03-01",
  source: { name: "service-contract.txt", version: "v1" },
};

const v2: AnswerVersion = {
  fact: "Arclight Signals",
  since: "2026-11-03",
  source: { name: "service-contract.txt", version: "v2" },
};

const DAY = 86_400_000;
const START = Date.UTC(2026, 2, 1); // 1 Mar
const END = Date.UTC(2026, 10, 18); // 18 Nov, the day of the test
const CHANGE = Date.UTC(2026, 10, 3); // 3 Nov
const TOTAL_DAYS = Math.round((END - START) / DAY);
const CHANGE_DAY = Math.round((CHANGE - START) / DAY);

const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const dayLabel = (d: number) => fmt.format(new Date(START + d * DAY));

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Fig3() {
  const [day, setDay] = useState(() => (reducedMotion() ? TOTAL_DAYS : 0));
  const touched = useRef(false);
  const host = useRef<HTMLDivElement>(null);

  // Play the timeline once when the figure first comes into view; any drag takes over.
  useEffect(() => {
    if (reducedMotion() || !host.current) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || touched.current) return;
        io.disconnect();
        const t0 = performance.now();
        const run = (now: number) => {
          if (touched.current) return;
          const k = Math.min(1, (now - t0) / 2600);
          const eased = 1 - Math.pow(1 - k, 3);
          setDay(Math.round(eased * TOTAL_DAYS));
          if (k < 1) raf = requestAnimationFrame(run);
        };
        raf = requestAnimationFrame(run);
      },
      { threshold: 0.55 },
    );
    io.observe(host.current);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    touched.current = true;
    setDay(Number(e.target.value));
  };

  const changed = day >= CHANGE_DAY;
  const changePct = (CHANGE_DAY / TOTAL_DAYS) * 100;

  return (
    <div className="fig3" ref={host}>
      <div className="fig3-screen">
        <ChangedAnswer
          locale="en-GB"
          question="Who maintains Signal 14?"
          current={changed ? v2 : v1}
          previous={changed ? v1 : undefined}
        >
          {(fact) => <>{fact} maintains it.</>}
        </ChangedAnswer>
      </div>
      <div className="scrub" style={{ ["--change" as string]: `${changePct}%` }}>
        <label className="scrub-label" htmlFor="scrub-input">
          Ask on <output htmlFor="scrub-input">{dayLabel(day)}</output>
        </label>
        <div className="scrub-track">
          <input
            id="scrub-input"
            type="range"
            min={0}
            max={TOTAL_DAYS}
            step={1}
            value={day}
            onChange={onInput}
            aria-valuetext={dayLabel(day)}
            style={{ ["--fill" as string]: `${(day / TOTAL_DAYS) * 100}%` }}
          />
          <span className="scrub-mark" aria-hidden="true">
            v2 · 3 Nov
          </span>
        </div>
        <div className="scrub-ends" aria-hidden="true">
          <span>1 Mar</span>
          <span>18 Nov</span>
        </div>
      </div>
    </div>
  );
}

const root = document.getElementById("fig3-root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Fig3 />
    </StrictMode>,
  );
}
