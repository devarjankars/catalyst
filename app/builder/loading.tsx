export default function Loading() {
  return (
    <div className="h-full flex flex-col bg-gray-50 animate-pulse">
      {/* Builder header shimmer */}
      <div className="bg-white border-b border-gray-200 h-14 flex items-center px-5 gap-3 shrink-0">
        <div className="h-8 w-20 bg-gray-200 rounded-full" />
        <div className="h-4 w-px bg-gray-200" />
        <div className="h-4 w-48 bg-gray-200 rounded" />
        <div className="ml-auto flex items-center gap-2">
          <div className="h-8 w-14 bg-gray-100 rounded-full" />
          <div className="h-8 w-14 bg-gray-100 rounded-full" />
          <div className="h-8 w-24 bg-gray-100 rounded-full" />
          <div className="h-8 w-20 bg-[#BC2030]/15 rounded-full" />
          <div className="h-8 w-20 bg-gray-100 rounded-full" />
        </div>
      </div>

      {/* Three-panel layout shimmer */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left — component palette */}
        <div className="w-72 shrink-0 bg-white border-r border-gray-200 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="h-3 w-24 bg-gray-200 rounded" />
          </div>
          <div className="p-3 space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-10 bg-gray-100 rounded-lg"
                style={{ opacity: 1 - i * 0.07 }}
              />
            ))}
          </div>
        </div>

        {/* Centre — canvas */}
        <div className="flex-1 bg-[#f0f2f5] flex items-start justify-center p-8 overflow-hidden">
          <div className="w-full max-w-[600px] bg-white rounded-xl shadow-sm overflow-hidden space-y-0">
            {/* Email header block */}
            <div className="h-20 bg-gray-200" />
            {/* Hero image */}
            <div className="h-48 bg-gray-100" />
            {/* Body text lines */}
            <div className="p-6 space-y-3">
              <div className="h-5 w-2/3 bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-100 rounded" />
              <div className="h-4 w-5/6 bg-gray-100 rounded" />
              <div className="h-4 w-4/5 bg-gray-100 rounded" />
            </div>
            {/* CTA button */}
            <div className="px-6 pb-6 flex justify-center">
              <div className="h-10 w-36 bg-[#BC2030]/20 rounded-full" />
            </div>
            {/* Footer */}
            <div className="h-16 bg-gray-200" />
          </div>
        </div>

        {/* Right — properties panel */}
        <div className="w-80 shrink-0 bg-white border-l border-gray-200 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="h-3 w-20 bg-gray-200 rounded" />
          </div>
          <div className="p-4 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1" style={{ opacity: 1 - i * 0.1 }}>
                <div className="h-3 w-16 bg-gray-200 rounded" />
                <div className="h-8 w-full bg-gray-100 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
