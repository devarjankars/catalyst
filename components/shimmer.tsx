"use client";

export function ShimmerCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 bg-gray-200 rounded-full w-16" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
      </div>
    </div>
  );
}

export function ShimmerCardGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerCard key={i} />
      ))}
    </div>
  );
}

export function ShimmerTableRow() {
  return (
    <tr className="animate-pulse border-b border-gray-100">
      <td className="px-4 py-3"><div className="h-4 w-4 bg-gray-200 rounded" /></td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-gray-200 rounded-lg shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3.5 bg-gray-200 rounded w-36" />
            <div className="h-2.5 bg-gray-200 rounded w-24" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3"><div className="h-3.5 bg-gray-200 rounded w-32" /></td>
      <td className="px-4 py-3"><div className="h-5 bg-gray-200 rounded-full w-20" /></td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded-md" />
          <div className="h-8 w-8 bg-gray-200 rounded-md" />
        </div>
      </td>
    </tr>
  );
}

export function ShimmerTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <ShimmerTableRow key={i} />
      ))}
    </div>
  );
}
