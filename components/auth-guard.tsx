"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLoggedInUserStore } from '@/store/logged-in-user'
import { LoadingSpinner } from "./loading-spinner";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
    const {userId, userEmail,userRole} = useLoggedInUserStore()
    const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
    const isUserManagementPage = pathname.startsWith("/dashboard/admin");
    const isTemplateManagementPage = pathname.startsWith("/dashboard/templates");

    if (!userId && !isAuthPage) {
       router.replace("/login");
    }

    // else if(userId && userRole !== "superadmin" && isUserManagementPage){
    //     router.replace("/dashboard");
    // }
    // else if (userId && userRole !== "superadmin"  && isTemplateManagementPage){
    //     router.replace("/dashboard");
    // }
    else if(userId && userRole !== "superadmin"){
        router.replace("/dashboard");
    }
    else if (userId && userRole !== "superadmin"){
        router.replace("/dashboard");
    }
    else {
        setIsChecking(false);
    }

  }, [pathname, router, userId]);

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