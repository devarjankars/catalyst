"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLoggedInUserStore } from '@/store/logged-in-user';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { userId, hydrate } = useLoggedInUserStore();
  const initialized = useRef(false);

  // Always start as "checking" — server and client first render match.
  // useEffect resolves it immediately on the client so there's no visible flash.
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

    // Already have in-memory session
    if (userId) {
      if (isAuthPage) router.replace("/");
      setIsChecking(false);
      return;
    }

    // Try restoring from sessionStorage
    const raw = sessionStorage.getItem("auth");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        hydrate(parsed);
        if (isAuthPage) router.replace("/");
        setIsChecking(false);
        return;
      } catch {
        sessionStorage.removeItem("auth");
      }
    }

    // No session
    if (!isAuthPage) router.replace("/login");
    setIsChecking(false);
  }, []);

  if (isChecking) {
    return <div className="w-screen h-screen bg-white" />;
  }

  return <>{children}</>;
}
