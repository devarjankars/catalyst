export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Page header shimmer */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-72 bg-gray-100 rounded" />
        </div>
        <div className="h-9 w-32 bg-gray-200 rounded-full" />
      </div>

      {/* Search + filter bar */}
      <div className="flex items-center gap-3">
        <div className="h-9 flex-1 bg-gray-100 rounded-lg max-w-xs" />
        <div className="h-9 w-24 bg-gray-100 rounded-lg" />
        <div className="h-9 w-24 bg-gray-100 rounded-lg" />
      </div>

      {/* Tab row */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-24 bg-gray-100 rounded-t-lg" />
        ))}
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 bg-white overflow-hidden"
            style={{ opacity: 1 - i * 0.08 }}
          >
            {/* Thumbnail */}
            <div className="h-40 bg-gray-100" />
            {/* Card body */}
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-3 w-1/2 bg-gray-100 rounded" />
              <div className="flex gap-2 pt-1">
                <div className="h-6 w-16 bg-gray-100 rounded-full" />
                <div className="h-6 w-16 bg-gray-100 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
