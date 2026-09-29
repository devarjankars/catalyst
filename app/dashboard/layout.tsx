"use client";

import { useRouter } from "next/navigation";
import { useLoggedInUserStore } from "@/store/logged-in-user";
import RouteLoader from "@/components/route-loader";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-50">
      <RouteLoader />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-h-0 flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  );
}
