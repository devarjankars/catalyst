"use client";

import {  ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Header() {

    const router = useRouter();
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
            <ArrowLeft onClick={()=>router.push("/dashboard")} className="cursor-pointer hover:translate-x-[-2px]"/>
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-paper">
            <span className="font-mono text-[13px] font-medium">W</span>
          </div>
          <span className="font-display text-[15px] font-semibold tracking-tight">
            WSB Generator
          </span>
        </div>
        <span className="font-mono text-[11px] uppercase tracking-wider text-slate-muted">
          Emailer Toolkit
        </span>
      </div>
    </header>
  );
}
