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
    // Only run the full auth check once on initial load
    if (initialized.current) return;
    initialized.current = true;

    const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

    if (!userId) {
      const raw = sessionStorage.getItem("auth");
      if (raw) {
        hydrate(JSON.parse(raw));
        setIsChecking(false);
        return;
      }
      if (!isAuthPage) {
        router.replace("/login");
        return;
      }
    } else if (isAuthPage) {
      router.replace("/dashboard");
      return;
    }

    setIsChecking(false);
  }, []);

  if (isChecking) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <LoadingSpinner message="Authenticating..." size="lg" />
      </div>
    );
  }

  return children;
}
