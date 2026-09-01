"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useLoggedInUserStore } from "@/store/logged-in-user";
import { FileText, LogOut, Home, Loader2 } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BrandSelectionModal, type Brand } from "./brand-selection-modal";

const menus = [
  { name: "Home", href: "/", icon: Home },
  { name: "Storyboard Creator", href: "/wsb", icon: FileText },
];

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { logoutUser, userEmail } = useLoggedInUserStore();
  const [isConnectingToMRL, setIsConnectingToMRL] = useState(false);
  const [mlrDialogOpen, setMlrDialogOpen] = useState(false);
  const [mlrDialogStep, setMlrDialogStep] = useState<'idle' | 'connecting' | 'redirecting' | 'success' | 'error'>('idle');
  const [mlrDialogMessage, setMlrDialogMessage] = useState('Preparing the MLR connection...');
  const [brandModalOpen, setBrandModalOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/dashboard/";
    if (href === "/dashboard/templates") return pathname === "/dashboard/templates" || pathname.startsWith("/dashboard/templates");
    return pathname.startsWith(href);
  };

  const isDashboardActive = pathname.includes("/dashboard");
  const initials = userEmail ? userEmail[0].toUpperCase() : "U";

  async function handleMLRConnect() {
    const email = 'kumar@medtrixhealthcare.com';
    const mlrUrl = encodeURI(`http://tuned.mlrcatalyst.com/MLRCatalyst/VerifyOTP?emailAddress=${email}`);
  

    setMlrDialogOpen(true);
    setMlrDialogStep('connecting');
    setMlrDialogMessage('Preparing the MLR connection...');
    setIsConnectingToMRL(true);

    try {
      const response = await fetch('http://34.55.227.107:8000/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(response.statusText || 'Failed to connect to MLR');
      }

      setMlrDialogStep('redirecting');
      setMlrDialogMessage('Opening the MLR portal in a new tab...');
     const anchor = document.createElement('a');
    anchor.href = mlrUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

      setMlrDialogStep('success');
      setMlrDialogMessage('The MLR page is opening. You can close this dialog once the new tab appears.');
    } catch (error) {
      console.error('Error during MLR connection:', error);
     
      setMlrDialogStep('error');
      setMlrDialogMessage('The connection could not be completed. Please try again.');
    } finally {
      setIsConnectingToMRL(false);
    }
  }

  function handleLogout() {
    logoutUser();
    router.replace("/login");
  }

  function handleBrandSelect(brand: Brand) {
    setBrandModalOpen(false);
    router.push(`/dashboard?brand=${brand}`);
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#BC2030] text-white font-semibold">
            AI
          </div>
          <div className="hidden flex-col text-sm sm:flex">
            <span className="font-semibold text-slate-900">Omnichannel Catalyst</span>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          {menus.map(({ name, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  active ? "bg-[#BC2030] text-white" : "text-slate-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {name}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setBrandModalOpen(true)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              isDashboardActive ? "bg-[#BC2030] text-white" : "text-slate-700 hover:bg-gray-100"
            }`}
          >
            <FileText className="h-4 w-4" />
            Email Builder
          </button>

          <button
            type="button"
            onClick={handleMLRConnect}
            disabled={isConnectingToMRL}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              isConnectingToMRL ? 'bg-gray-200 text-slate-500 cursor-not-allowed' : 'text-slate-700 hover:bg-gray-100'
            }`}
          >
            <FileText className="h-4 w-4" />
            MLR Catalyst
            {isConnectingToMRL && <Loader2 className="h-4 w-4 animate-spin" />}
          </button>
        </nav>

        <div className="flex items-center gap-3">
         
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFE7E7] text-[#BC2030] font-semibold">
            {initials}
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </header>

      <Dialog open={mlrDialogOpen} onOpenChange={(open) => {
        if (!isConnectingToMRL) {
          setMlrDialogOpen(open);
        }
      }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Connecting to MLR</DialogTitle>
            <DialogDescription>{mlrDialogMessage}</DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-3 rounded-lg border bg-slate-50 p-4">
            {(mlrDialogStep === 'connecting' || mlrDialogStep === 'redirecting') && (
              <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-blue-600" />
            )}
            <div className="text-sm text-slate-700">
              {mlrDialogStep === 'connecting' && 'Preparing the MLR connection request...'}
              {mlrDialogStep === 'redirecting' && 'Opening the MLR portal in a new tab...'}
              {mlrDialogStep === 'success' && 'The MLR page is opening. You can close this dialog once the new tab appears.'}
              {mlrDialogStep === 'error' && 'The connection could not be completed. Please try again.'}
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setMlrDialogOpen(false)}
              className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              disabled={mlrDialogStep === 'connecting' || mlrDialogStep === 'redirecting'}
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BrandSelectionModal
        open={brandModalOpen}
        onOpenChange={setBrandModalOpen}
        onSelect={handleBrandSelect}
      />
    </>
  );
}
