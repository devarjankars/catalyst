export default function ResultCard({ document, confidence, onReset }) {
  const draft = document?.generatedDraft;
  const title = draft?.title || document?.label || "Work statement brief";
  const topic = draft?.topic || "topic";
  const summary = draft?.summary || "Mock WSB draft ready for review.";

  return (
    <div className="animate-rise rounded-xl border border-line bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-wider text-signal">
            Work statement brief ready
          </p>
          <h3 className="mt-1 font-display text-[16px] font-semibold text-ink">
            {title}
          </h3>
          <p className="mt-1 font-mono text-[11.5px] text-slate-muted">
            Topic focus: {topic} • match confidence {(confidence * 100).toFixed(0)}%
          </p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-signal-soft text-signal">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </div>
      </div>

      <p className="mt-4 text-[13px] leading-6 text-slate-muted">{summary}</p>

      

      <div className="mt-4 flex items-center gap-2">
        <a
          href={document?.file}
          download
          className="rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-paper transition hover:bg-ink/85"
        >
          Download WSB
        </a>
        <button
          onClick={onReset}
          className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-slate-muted transition hover:bg-paper"
        >
          Start another
        </button>
      </div>
    </div>
  );
}
