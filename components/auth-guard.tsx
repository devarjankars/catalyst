"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLoggedInUserStore } from '@/store/logged-in-user'
import { LoadingSpinner } from "./loading-spinner";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
    const {userId, userEmail,userRole , hydrate} = useLoggedInUserStore()
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
    const isAuthPage =
      pathname.startsWith("/login") || pathname.startsWith("/register");

    if (!userId) {
      const raw = sessionStorage.getItem("auth");
      if (raw) {
        const parsed = JSON.parse(raw);
        hydrate(parsed);
        setIsChecking(false);
        return;
      }
    }
    if (!userId && !isAuthPage) {
      router.replace("/login");
      return;
    }
    if (userId && isAuthPage) {
      router.replace("/dashboard");
      return;
    }

    setIsChecking(false);
  }, [pathname, router, userId, hydrate]);

  if (isChecking) {
    // Optional loader or blank screen
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LoadingSpinner message="Athenticating....." size="lg" />
      </div>
    );
  }

  return children;
}