"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLoggedInUserStore } from '@/store/logged-in-user';
import { LoadingSpinner } from "./loading-spinner";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { userId, hydrate } = useLoggedInUserStore();
  const [isChecking, setIsChecking] = useState(true);
  const initialized = useRef(false);

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
        // Session is valid — don't redirect, let the app render
        if (isAuthPage) router.replace("/");
        setIsChecking(false);
        return;
      } catch {
        // Corrupt session data — clear it
        sessionStorage.removeItem("auth");
      }
    }

    // No session — redirect to login if not already there
    if (!isAuthPage) {
      router.replace("/login");
    }
    setIsChecking(false);
  }, []);

  if (isChecking) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <LoadingSpinner message="MEDTRIX..." size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
