// Demo for graphon-memory.html. Bundled into demo.js / demo.css with esbuild (command in README.md).
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ChangedAnswer, type AnswerVersion } from "./ChangedAnswer";

const before: AnswerVersion = {
  fact: "Northgate Signals",
  since: "2026-03-01",
  source: { name: "service-contract.txt", version: "v1" },
};

const after: AnswerVersion = {
  fact: "Arclight Signals",
  since: "2026-11-03",
  source: { name: "service-contract.txt", version: "v2" },
};

const still =
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
  new URLSearchParams(window.location.search).has("still");

function Demo() {
  const [cycle, setCycle] = useState(0);
  const [changed, setChanged] = useState(still);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (still) return;
    const timers = [
      window.setTimeout(() => setChanged(true), 1600),
      window.setTimeout(() => setVisible(false), 7200),
      window.setTimeout(() => {
        setChanged(false);
        setVisible(true);
        setCycle((c) => c + 1);
      }, 7700),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [cycle]);

  return (
    <div className="demo" data-visible={visible}>
      <ChangedAnswer
        key={cycle}
        locale="en-GB"
        question="Who maintains Signal 14?"
        current={changed ? after : before}
        previous={changed ? before : undefined}
      >
        {(fact) => <>{fact} maintains it.</>}
      </ChangedAnswer>
    </div>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Demo />
    </StrictMode>,
  );
}
