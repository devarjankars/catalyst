"use client";

import { usePathname } from "next/navigation";
import AuthGuard from "@/components/auth-guard";
import TopNav from "@/components/top-nav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideTopNav = pathname.startsWith("/login") || pathname.startsWith("/register");

  return (
    <AuthGuard>
      <div className="h-screen overflow-hidden flex flex-col bg-gray-50">
        {!hideTopNav && <TopNav />}
        <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>
      </div>
    </AuthGuard>
  );
}
