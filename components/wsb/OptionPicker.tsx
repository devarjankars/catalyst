/**
 * OptionPicker
 * Renders a clarifying question with clickable option pills.
 * Props:
 *   question  – string shown above the options
 *   options   – array of { id, label } objects
 *   onPick    – (option) => void
 */
export default function OptionPicker({ question, options, onPick }) {
  return (
    <div className="animate-rise flex flex-col gap-3">
      {/* Question bubble (same style as AI message) */}
      <div className="flex justify-start">
        <div className="max-w-[80%] rounded-xl border border-line bg-white px-4 py-2.5 text-[14px] leading-snug text-ink">
          {question}
        </div>
      </div>

      {/* Option buttons */}
      <div className="flex flex-wrap gap-2 pl-1">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onPick(opt)}
            className="
              group relative overflow-hidden
              rounded-lg border border-line bg-white
              px-4 py-2 text-[13px] font-medium text-ink
              shadow-sm transition-all duration-200
              hover:border-signal hover:shadow-md
              active:scale-95
            "
          >
            {/* Hover fill */}
            <span
              className="
                absolute inset-0 bg-signal opacity-0
                transition-opacity duration-200 group-hover:opacity-[0.07]
              "
            />
            <span className="relative">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
