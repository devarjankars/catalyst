"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Users, UserCircle, Menu , House , Heart , LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SideBar() {
  const [open, setOpen] = useState(false);
    const router = useRouter();
  return (
    <>
     <motion.aside
      initial={false} // prevent landing jerk
      animate={{ width: open ? 240 : 80 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="relative top-0 left-0 z-50 h-full flex flex-col bg-white border-r border-gray-200 text-gray-800 shadow-sm"
    >
      
      <button
        onClick={() => setOpen(!open)}
        className="absolute -right-3 top-4 z-100 rounded-full bg-white border shadow p-1 hover:bg-gray-50"
      >
        <Menu className="h-5 w-5 text-gray-600" />
      </button>

      <div className="flex items-center gap-2 px-4 py-4">
        <div className="h-9 w-9 rounded-xl bg-[#FFE7E7] text-[#4A5565] grid place-items-center font-bold shadow-sm">
          D
        </div>
        <AnimatePresence>
          {open && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="text-lg font-semibold text-[#4A5565] overflow-hidden whitespace-nowrap"
            >
              DragCraft
            </motion.span>
          )}
        </AnimatePresence>
      </div>

     
      <nav className="mt-4 flex-1">
        <ul className="space-y-1 px-2">
          <li>
            
            <a href="#" onClick={() => router.push('/dashboard')}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-[#FFE7E7] hover:text-[#4A5565] transition"
            >
              <House className="h-5 w-5 text-black-500" />
              <AnimatePresence>
                {open && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    Home
                  </motion.span>
                )}
              </AnimatePresence>
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-[#FFE7E7] hover:text-[#4A5565] transition"
            >
              <LayoutGrid className="h-5 w-5 text-black-500" />
              <AnimatePresence>
                {open && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    Projects
                  </motion.span>
                )}
              </AnimatePresence>
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-[#FFE7E7] hover:text-[#4A5565] transition"
            >
              <Heart className="h-5 w-5 text-black-500" />
              <AnimatePresence>
                {open && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    Favourites
                  </motion.span>
                )}
              </AnimatePresence>
            </a>
          </li>
          <li>
            <a href="#"
              onClick={() => router.push('/dashboard/admin')}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-[#FFE7E7] hover:text-[#4A5565] transition"
            >
              <Users className="h-5 w-5 text-black-500" />
              <AnimatePresence>
                {open && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    Users & Permissions
                  </motion.span>
                )}
              </AnimatePresence>
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-[#FFE7E7] hover:text-[#4A5565] transition"
            >
              <UserCircle className="h-5 w-5 text-black-500" />
              <AnimatePresence>
                {open && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    Profile settings
                  </motion.span>
                )}
              </AnimatePresence>
            </a>
          </li>
        </ul>
      </nav>
       <a href="#" className="flex items-center gap-3 border-t border-gray-200 p-4 text-xs text-gray-500 hover:font-bold">
        <LogOut className="h-5 w-5 text-black-500"/>
        <AnimatePresence>
          {open && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap"
            >
              Logout
            </motion.span>
          )}
        </AnimatePresence>
      </a>
    </motion.aside>
    </>
  );
}
