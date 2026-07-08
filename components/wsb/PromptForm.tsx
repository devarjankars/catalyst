import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";

export default function PromptForm({ onSubmit, disabled, placeholder, autoFocus = false }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSubmit(value.trim());
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-xl  p-1">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) handleSubmit(e);
        }}
        disabled={disabled}
        rows={2}
        placeholder={placeholder}
        className="min-h-[46px] w-full resize-none rounded-lg border border-line bg-white px-4 py-3 text-[14px] leading-snug placeholder:text-slate-muted/70 focus:outline-none focus:ring-2 focus:ring-signal/30 disabled:opacity-50"
      />
      <Button
      variant="outline"
        type="submit"
        disabled={disabled || !value.trim()}
        className="h-[46px] shrink-0 rounded-lg bg-ink px-5 text-[13px] font-medium text-paper transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Send
      </Button>
    </form>
  );
}
