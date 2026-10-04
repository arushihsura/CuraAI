"use client";

import React, { useState } from 'react'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import { HeartPulse, Menu } from 'lucide-react'

const menuOptions = [
  { id: 1, name: 'Overview', path: '/dashboard' },
  { id: 2, name: 'Consultations', path: '/dashboard/history' },
  { id: 4, name: 'Documents', path: '/dashboard/documents' },
  { id: 3, name: 'Billing', path: '/dashboard/billing' },
];

function AppHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
      <Link href="/dashboard" className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#087ea4] text-white">
          <HeartPulse className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[1.15rem] font-semibold leading-none tracking-tight">CuraAi</p>
          <p className="hidden text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500 sm:block dark:text-slate-400">Health record</p>
        </div>
      </Link>

      <nav className="hidden items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-50/80 p-1 md:flex dark:border-slate-800 dark:bg-slate-900/70">
        {menuOptions.map(option => (
          <Link
            key={option.id}
            href={option.path}
            className={`rounded-lg px-3.5 py-2 text-[13px] font-medium transition ${pathname === option.path ? "bg-white text-[#087ea4] shadow-sm dark:bg-slate-800 dark:text-cyan-300" : "text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"}`}
          >
            {option.name}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setMobileOpen((open) => !open)} className="rounded-lg border border-slate-200 p-2 text-slate-500 md:hidden dark:border-slate-700" aria-label="Open navigation" aria-expanded={mobileOpen}>
          <Menu className="h-5 w-5" />
        </button>
        <UserButton />
      </div>
      </div>
      {mobileOpen ? (
        <nav className="border-t border-slate-200 px-5 py-3 md:hidden dark:border-slate-800">
          {menuOptions.map((option) => (
            <Link
              key={option.id}
              href={option.path}
              onClick={() => setMobileOpen(false)}
              className={`block border-b border-slate-100 px-1 py-3 text-sm font-medium last:border-0 dark:border-slate-800 ${pathname === option.path ? "text-[#087ea4]" : "text-slate-600 dark:text-slate-300"}`}
            >
              {option.name}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}

export default AppHeader;
