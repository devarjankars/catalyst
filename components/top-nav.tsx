"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLoggedInUserStore } from "@/store/logged-in-user";
import { House, FileCheck, FileMinus, FileText, LogOut } from "lucide-react";
import Link from "next/link";

const menus = [
  { name: "Home", href: "/dashboard", icon: House },
  { name: "Standard Templates", href: "/dashboard/standard-templates", icon: FileCheck },
  { name: "All Emailers", href: "/dashboard/templates", icon: FileMinus },
  { name: "VSB PDFs", href: "/dashboard/vsb-pdfs", icon: FileText },
];

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { logoutUser, userEmail } = useLoggedInUserStore();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/dashboard/";
    if (href === "/dashboard/templates") return pathname === "/dashboard/templates" || pathname.startsWith("/dashboard/templates");
    return pathname.startsWith(href);
  };

  const initials = userEmail ? userEmail[0].toUpperCase() : "U";

  function handleLogout() {
    logoutUser();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-6 h-14">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-[#BC2030] grid place-items-center shadow">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <span className="font-semibold text-gray-800 text-sm tracking-wide">Email Builder</span>
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {menus.map(({ name, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-[#BC2030] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="h-8 w-8 rounded-full bg-[#FFE7E7] grid place-items-center text-[#BC2030] font-semibold text-sm">
            {initials}
          </div>
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
