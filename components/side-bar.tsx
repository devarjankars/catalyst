"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { House, FileCheck, FileMinus, FileText, LogOut, ChevronRight, ChevronLeft } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useLoggedInUserStore } from "@/store/logged-in-user";
import Link from "next/link";

const menus = [
  { name: "Home", href: "/dashboard", icon: House },
  { name: "Standard Templates", href: "/dashboard/standard-templates", icon: FileCheck },
  { name: "All Emailers", href: "/dashboard/templates", icon: FileMinus },
  { name: "VSB PDFs", href: "/dashboard/vsb-pdfs", icon: FileText },
];

export default function SideBar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { logoutUser } = useLoggedInUserStore();

  function handleLogout() {
    logoutUser();
    router.replace("/login");
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/dashboard/";
    if (href === "/dashboard/templates") return pathname === "/dashboard/templates";
    return pathname.startsWith(href);
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: open ? 220 : 68 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="relative flex flex-col h-full z-50 overflow-hidden"
      style={{ background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
    >
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="absolute -right-3 top-6 z-50 h-6 w-6 rounded-full bg-[#BC2030] shadow-lg flex items-center justify-center hover:bg-[#9e1a28] transition-colors"
      >
        {open ? <ChevronLeft className="h-3.5 w-3.5 text-white" /> : <ChevronRight className="h-3.5 w-3.5 text-white" />}
      </button>

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-8">
        <div className="h-9 w-9 shrink-0 rounded-xl bg-[#BC2030] grid place-items-center shadow-lg">
          <span className="text-white font-bold text-base">E</span>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="text-white font-bold text-sm whitespace-nowrap leading-tight">Email Builder</p>
              <p className="text-white/40 text-xs whitespace-nowrap">Design Studio</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-1">
        {menus.map((menu) => {
          const Icon = menu.icon;
          const active = isActive(menu.href);
          return (
            <Link
              key={menu.href}
              href={menu.href}
              title={!open ? menu.name : undefined}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                active
                  ? "bg-[#BC2030] shadow-lg shadow-[#BC2030]/30"
                  : "hover:bg-white/10"
              }`}
            >
              {/* Active left bar */}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-white" />
              )}
              <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${active ? "text-white" : "text-white/50 group-hover:text-white"}`} />
              <AnimatePresence>
                {open && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className={`text-sm whitespace-nowrap overflow-hidden font-medium ${active ? "text-white" : "text-white/60 group-hover:text-white"}`}
                  >
                    {menu.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 my-2 border-t border-white/10" />

      {/* Logout */}
      <button
        onClick={handleLogout}
        title={!open ? "Logout" : undefined}
        className="group flex items-center gap-3 px-5 py-4 transition-all duration-200 hover:bg-white/10"
      >
        <LogOut className="h-[18px] w-[18px] shrink-0 text-white/50 group-hover:text-red-400 transition-colors" />
        <AnimatePresence>
          {open && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="text-sm font-medium text-white/60 group-hover:text-red-400 whitespace-nowrap overflow-hidden transition-colors"
            >
              Logout
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </motion.aside>
  );
}
