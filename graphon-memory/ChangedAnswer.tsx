/**
 * ChangedAnswer
 *
 * Shows an answer whose underlying fact changed, without forgetting the old one.
 * The current answer sits on top; the previous answer stays visible behind it,
 * with the date it stopped being true. When `current` changes while mounted,
 * the new answer drops onto the stack and the old one recedes.
 *
 * - React 18+, no dependencies. Styles live in ./changed-answer.css and are
 *   themed through CSS custom properties (see the top of that file).
 * - Accessible: the current answer comes first in reading order, the change is
 *   announced through a polite live region, dates use <time dateTime>.
 * - Respects prefers-reduced-motion (no movement, same final layout).
 *
 * Free to use (MIT). Concept by Bhanu Kowshik, not affiliated with Graphon.
 */
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type AnimationEvent,
  type ReactNode,
} from "react";
import "./changed-answer.css";

export interface SourceRef {
  /** Object key or file name, e.g. "service-contract.txt". */
  name: string;
  /** Version label shown with the source, e.g. "v2". */
  version?: string;
  /** Optional link that opens the cited source. */
  href?: string;
}

export interface AnswerVersion {
  /** The fact that differs between versions, e.g. a vendor name. */
  fact: string;
  /** ISO 8601 date (YYYY-MM-DD) from which this version is true. */
  since: string;
  /** Where this version of the fact came from. */
  source: SourceRef;
}

export interface ChangedAnswerLabels {
  /** Chip on the current answer. Receives the formatted change date. */
  changed: (date: string) => string;
  /** Prefix for the previous fact inside the chip. */
  was: string;
  /** Meta line on the previous answer. Receives the formatted end date. */
  until: (date: string) => string;
  /** Meta line on the current answer. Receives the formatted start date. */
  since: (date: string) => string;
  /** Live-region announcement when the answer changes. */
  announce: (args: { date: string; from: string; to: string }) => string;
}

export interface ChangedAnswerProps {
  /** The question the answer responds to. */
  question: string;
  /** The answer that is true now. */
  current: AnswerVersion;
  /** The answer that was true before `current.since`. Omit if nothing changed. */
  previous?: AnswerVersion;
  /**
   * Renders the sentence around the fact. Receives the fact as a node
   * (already highlighted for the current answer). Defaults to the fact alone.
   */
  children?: (fact: ReactNode) => ReactNode;
  /** Play the change animation on first mount too. Default: false. */
  animateOnMount?: boolean;
  /** BCP 47 locale for dates. Default: the browser locale. */
  locale?: string;
  /** Override any user-facing text, e.g. for translation. */
  labels?: Partial<ChangedAnswerLabels>;
  className?: string;
}

const DEFAULT_LABELS: ChangedAnswerLabels = {
  changed: (date) => `Changed ${date}`,
  was: "was",
  until: (date) => `until ${date}`,
  since: (date) => `since ${date}`,
  announce: ({ date, from, to }) =>
    `Answer changed on ${date}: ${from} is now ${to}.`,
};

/** Formats an ISO date as "3 Nov" (locale aware), reading it as a calendar date in UTC. */
function useDateFormatter(locale?: string) {
  return useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
    return (iso: string) => {
      const d = new Date(iso);
      return Number.isNaN(d.getTime()) ? iso : fmt.format(d);
    };
  }, [locale]);
}

function SourceLine({ source, meta }: { source: SourceRef; meta: ReactNode }) {
  const label = source.version ? `${source.name} · ${source.version}` : source.name;
  return (
    <p className="ca-src">
      {source.href ? (
        <a className="ca-src-name" href={source.href}>
          {label}
        </a>
      ) : (
        <span className="ca-src-name">{label}</span>
      )}
      <span className="ca-src-meta">{meta}</span>
    </p>
  );
}

export function ChangedAnswer({
  question,
  current,
  previous,
  children,
  animateOnMount = false,
  locale,
  labels,
  className,
}: ChangedAnswerProps) {
  const t = { ...DEFAULT_LABELS, ...labels };
  const fmt = useDateFormatter(locale);
  const questionId = useId();

  // Animate only when the current version actually changes (or on mount, if asked).
  const versionKey = `${current.since}|${current.fact}`;
  const lastKey = useRef<string | null>(animateOnMount ? null : versionKey);
  const [entering, setEntering] = useState(animateOnMount && Boolean(previous));
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (lastKey.current === versionKey) return;
    lastKey.current = versionKey;
    if (!previous) return;
    setEntering(true);
    setAnnouncement(
      t.announce({ date: fmt(current.since), from: previous.fact, to: current.fact }),
    );
    // `t` and `fmt` are derived from props; versionKey is the real trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionKey]);

  const onAnimationEnd = (e: AnimationEvent<HTMLElement>) => {
    if (e.target === e.currentTarget) setEntering(false);
  };

  const render = children ?? ((fact: ReactNode) => fact);
  const since = fmt(current.since);

  return (
    <section
      className={className ? `ca ${className}` : "ca"}
      data-entering={entering || undefined}
      aria-labelledby={questionId}
    >
      <p className="ca-q" id={questionId}>
        {question}
      </p>

      <div className="ca-stack">
        <article className="ca-card ca-card--now" onAnimationEnd={onAnimationEnd}>
          {previous && (
            <p className="ca-chip">
              <time dateTime={current.since}>{t.changed(since)}</time>
              <span className="ca-chip-was">
                {t.was} <s>{previous.fact}</s>
              </span>
            </p>
          )}
          <p className="ca-a">{render(<mark className="ca-fact">{current.fact}</mark>)}</p>
          <SourceLine
            source={current.source}
            meta={<time dateTime={current.since}>{t.since(since)}</time>}
          />
        </article>

        {previous && (
          <article className="ca-card ca-card--prev" aria-label={t.until(since)}>
            <p className="ca-a">{render(previous.fact)}</p>
            <SourceLine
              source={previous.source}
              meta={<time dateTime={current.since}>{t.until(since)}</time>}
            />
          </article>
        )}
      </div>

      <p className="ca-sr" aria-live="polite">
        {announcement}
      </p>
    </section>
  );
}

export default ChangedAnswer;
