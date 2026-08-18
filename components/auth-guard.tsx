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

    if (!userId) {
      const raw = sessionStorage.getItem("auth");
      if (raw) {
        try { hydrate(JSON.parse(raw)); } catch {}
        setIsChecking(false);
        return;
      }
      if (!isAuthPage) {
        // Redirect to login but stop spinner so the login page renders immediately
        router.replace("/login");
        setIsChecking(false);
        return;
      }
    } else if (isAuthPage) {
      router.replace("/dashboard");
      setIsChecking(false);
      return;
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
