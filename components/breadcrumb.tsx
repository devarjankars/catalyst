"use client";

import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Breadcrumb() {
  const pathname = usePathname(); 
  const segments = pathname.split("/").filter(Boolean);

  const labelMap: Record<string, string> = {
    dashboard: "Home",
    folders: "Projects",
    elzonris: "Elzonris", 
  };

  const paths = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = labelMap[segment] || (segment.charAt(0).toUpperCase() + segment.slice(1));
    return { label, href };
  });
// console.log(paths)
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      {paths.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="w-4 place-items-center" />}
          <Link href={crumb.href} className="hover:underline">
            {crumb.label}
          </Link>
        </span>
      ))}
    </div>
  );
}
