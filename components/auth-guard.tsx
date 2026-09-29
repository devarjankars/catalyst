"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLoggedInUserStore } from '@/store/logged-in-user';

// Synchronously read sessionStorage before first render to avoid flash
function getInitialAuthState(pathname: string) {
  if (typeof window === "undefined") return { checked: false, authed: false };

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  // In-memory Zustand state is not available here — check sessionStorage directly
  const raw = sessionStorage.getItem("auth");
  if (raw) {
    try {
      JSON.parse(raw); // validate it's parseable
      return { checked: true, authed: true, isAuthPage };
    } catch {
      sessionStorage.removeItem("auth");
    }
  }
  return { checked: true, authed: false, isAuthPage };
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { userId, hydrate } = useLoggedInUserStore();
  const initialized = useRef(false);

  // Initialise synchronously — no spinner needed in most cases
  const [isChecking, setIsChecking] = useState(() => {
    if (typeof window === "undefined") return true;
    const { checked } = getInitialAuthState(pathname);
    return !checked;
  });

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

    // If Zustand already has userId (in-memory, e.g. same tab), we're done
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

    // No session — redirect to login if not already there
    if (!isAuthPage) {
      router.replace("/login");
    }
    setIsChecking(false);
  }, []);

  // Only show a blocking screen if we genuinely can't determine auth state
  // (SSR or a race condition). Normally isChecking is false from the start.
  if (isChecking) {
    return (
      <div className="w-screen h-screen bg-white" />
    );
  }

  return <>{children}</>;
}
