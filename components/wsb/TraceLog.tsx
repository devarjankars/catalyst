import { TraceLine } from "@/lib/wsb/types";

export default function TraceLog({ lines }: { lines: TraceLine[] }) {
  if (lines.length === 0) return null;

  return (
    <div className="rounded-lg border border-line bg-ink px-4 py-3 font-mono text-[12.5px] leading-relaxed">
      {lines.map((line, i) => (
        <div
          key={i}
          className="animate-rise flex items-baseline gap-2"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <span className="text-slate-muted/60">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span
            className={
              line.tone === "match"
                ? "text-emerald-400"
                : line.tone === "miss"
                ? "text-trace"
                : "text-paper/80"
            }
          >
            {line.text}
          </span>
        </div>
      ))}
      <span className="ml-6 inline-block h-3 w-[6px] animate-blink bg-paper/60 align-middle" />
    </div>
  );
}
