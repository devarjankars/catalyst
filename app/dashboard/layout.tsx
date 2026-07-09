"use client";

import { useRouter } from "next/navigation";
import { useLoggedInUserStore } from "@/store/logged-in-user";
import { LogOut } from "lucide-react";
import TopNav from "@/components/top-nav";
import RouteLoader from "@/components/route-loader";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { logoutUser, userEmail } = useLoggedInUserStore();
  const router = useRouter();
  const initials = userEmail ? userEmail[0].toUpperCase() : "U";

  const handleLogout = () => {
    logoutUser();
    router.replace("/login");
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-50">
      <RouteLoader />

      <div className="flex min-w-0 flex-1 flex-col">
       
        <main className="min-h-0 flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  );
}
