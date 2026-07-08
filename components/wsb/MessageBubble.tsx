export default function MessageBubble({ from, children }) {
  const isUser = from === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`animate-rise max-w-[80%] rounded-xl px-4 py-2.5 text-[14px] leading-snug ${
          isUser
            ? "bg-ink text-paper"
            : "border border-line bg-white text-ink"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
