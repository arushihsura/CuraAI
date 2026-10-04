"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  HeartPulse,
  LockKeyhole,
  MessageSquare,
  Mic,
  Menu,
  ShieldCheck,
  Stethoscope,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIDoctorAgents } from "@/shared/list";

const workflow = [
  ["01", "Tell us what you’re experiencing", "Describe your symptoms by voice or text."],
  ["02", "Understand your symptoms", "Answer focused questions and check for potential warning signs."],
  ["03", "Find the right specialist", "Use your symptoms to find the most relevant health specialist."],
  ["04", "Have your consultation", "Speak naturally through a real-time voice conversation."],
  ["05", "Keep your consultation record", "Review your summary, recommendations and follow-up information."],
];

export default function Home() {
  const { user } = useUser();
  const destination = user ? "/dashboard" : "/sign-in";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#172033] dark:bg-slate-950 dark:text-white">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" className="group flex items-center gap-3" aria-label="CuraAi home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#087ea4] text-white shadow-sm transition group-hover:bg-[#066a89]">
              <HeartPulse className="h-[19px] w-[19px]" strokeWidth={2.2} />
            </span>
            <span>
              <span className="block text-[1.15rem] font-semibold leading-none tracking-tight">CuraAi</span>
              <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">Health guidance</span>
            </span>
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-50/80 p-1 md:flex dark:border-slate-800 dark:bg-slate-900/70" aria-label="Main navigation">
            {[
              ["How it works", "#how-it-works"],
              ["Specialists", "#specialists"],
              ["Safety", "#safety"],
              ["Health records", "#records"],
            ].map(([label, href]) => (
              <a key={href} href={href} className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-slate-600 transition hover:bg-white hover:text-[#087ea4] hover:shadow-sm dark:text-slate-300 dark:hover:bg-slate-800">
                {label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Link href={user ? "/dashboard" : "/sign-in"} className="px-2 py-2 text-sm font-semibold text-slate-600 transition hover:text-[#087ea4] dark:text-slate-300">
              {user ? "Dashboard" : "Sign in"}
            </Link>
            <Link href={destination}>
              <Button className="h-10 rounded-lg bg-[#087ea4] px-4 text-sm font-semibold shadow-sm hover:bg-[#066a89]">
                {user ? "Open CuraAi" : "Get started"}
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="rounded-lg border border-slate-200 p-2.5 text-slate-600 sm:hidden dark:border-slate-700 dark:text-slate-300"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileMenuOpen ? (
          <div className="border-t border-slate-200 bg-white px-5 py-4 sm:hidden dark:border-slate-800 dark:bg-slate-950">
            <nav className="grid gap-1" aria-label="Mobile navigation">
              {[
                ["How it works", "#how-it-works"],
                ["Specialists", "#specialists"],
                ["Safety", "#safety"],
                ["Health records", "#records"],
              ].map(([label, href]) => (
                <a key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-[#087ea4] dark:text-slate-300 dark:hover:bg-slate-900">
                  {label}
                </a>
              ))}
            </nav>
            <div className="mt-3 flex gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
              <Link href={user ? "/dashboard" : "/sign-in"} onClick={() => setMobileMenuOpen(false)} className="flex h-10 flex-1 items-center justify-center rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                {user ? "Dashboard" : "Sign in"}
              </Link>
              <Link href={destination} onClick={() => setMobileMenuOpen(false)} className="flex h-10 flex-1 items-center justify-center rounded-lg bg-[#087ea4] text-sm font-semibold text-white">
                Get started
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:pb-24 lg:pt-24">
        <div className="max-w-2xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.16em] text-[#087ea4]">Digital healthcare guidance</p>
          <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-[-0.03em] sm:text-5xl lg:text-[3.5rem]">
            Healthcare guidance, starting with a conversation.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Describe what you’re experiencing, answer a few questions, and let CuraAi guide you toward the appropriate next step.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={destination}>
              <Button className="h-11 w-full rounded-lg bg-[#087ea4] px-5 hover:bg-[#066a89] sm:w-auto">
                Start a health assessment <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#specialists" className="flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-[#087ea4] hover:text-[#087ea4] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              Explore specialists
            </a>
          </div>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500 dark:text-slate-400">
            {["Private by design", "AI-assisted", "Available 24/7"].map((item) => (
              <span key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#087ea4]" />{item}</span>
            ))}
          </div>
          <p className="mt-7 max-w-lg border-l-2 border-red-300 pl-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Not for medical emergencies. AI-generated information is informational and does not replace professional medical care.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e6f4f8] text-[#087ea4] dark:bg-cyan-950/50"><Stethoscope className="h-5 w-5" /></div>
            <div><p className="font-semibold">Start a health assessment</p><p className="text-xs text-slate-500 dark:text-slate-400">A private place to begin</p></div>
          </div>
          <p className="mt-6 text-sm font-medium text-slate-700 dark:text-slate-200">What are you experiencing today?</p>
          <div className="mt-3 min-h-24 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-950">Describe your symptoms</div>
          <Link href={destination} className="mt-3 flex h-11 items-center justify-center gap-2 rounded-lg border border-[#087ea4] text-sm font-semibold text-[#087ea4] transition hover:bg-[#e6f4f8]">
            <Mic className="h-4 w-4" /> Start with voice
          </Link>
          <div className="mt-5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><LockKeyhole className="h-4 w-4 text-[#087ea4]" /> Your information is private</div>
          <Link href={destination} className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 text-sm font-semibold text-[#087ea4] dark:border-slate-800">Continue <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-slate-200 bg-white py-20 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#087ea4]">A clear path to care</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">How CuraAi works</h2>
          <div className="mt-10 grid gap-0 md:grid-cols-5">
            {workflow.map(([number, title, description], index) => (
              <div key={number} className="relative border-l border-slate-200 py-2 pl-5 pr-5 first:border-l-0 dark:border-slate-700 md:min-h-44">
                <span className="text-sm font-semibold text-[#087ea4]">{number}</span>
                <h3 className="mt-4 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
                {index < workflow.length - 1 && <ArrowRight className="absolute right-0 top-3 hidden h-4 w-4 text-slate-300 md:block" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="specialists" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#087ea4]">Your care team</p>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Meet your CuraAi specialists</h2>
          <Link href={destination} className="text-sm font-semibold text-[#087ea4]">View all specialists <ArrowRight className="ml-1 inline h-4 w-4" /></Link>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AIDoctorAgents.slice(0, 6).map((doctor) => (
            <Link href={destination} key={doctor.id} className="flex items-center justify-between border border-slate-200 bg-white p-4 transition hover:border-[#087ea4] dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e6f4f8] text-[#087ea4] dark:bg-cyan-950/50"><Stethoscope className="h-4 w-4" /></span><div><p className="font-semibold">{doctor.specialist}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{doctor.description}</p></div></div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
            </Link>
          ))}
        </div>
      </section>

      <section id="safety" className="border-y border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <h2 className="text-3xl font-semibold tracking-tight">Built with safety in mind</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <SafetyCard icon={<AlertTriangle />} title="Emergency guidance" text="CuraAi is not designed for medical emergencies. Seek immediate professional care when necessary." emergency />
            <SafetyCard icon={<ShieldCheck />} title="Privacy" text="Keep your healthcare conversations and records within your account." />
            <SafetyCard icon={<MessageSquare />} title="AI limitations" text="AI-generated information is informational and does not constitute a diagnosis or treatment plan." />
          </div>
        </div>
      </section>

      <section id="records" className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:px-10">
        <div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#087ea4]">Your health record</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Your health record, in one place</h2><p className="mt-4 max-w-lg leading-7 text-slate-600 dark:text-slate-300">Keep consultations, reports, follow-ups and health documents organized so your next conversation starts with better context.</p><Link href={destination} className="mt-6 inline-flex items-center text-sm font-semibold text-[#087ea4]">Open your health record <ArrowRight className="ml-2 h-4 w-4" /></Link></div>
        <div className="border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recent consultation</p><p className="mt-1 font-semibold">General Physician</p></div><span className="text-xs text-slate-500">Oct 04, 2026</span></div>
          <div className="grid gap-4 py-5 sm:grid-cols-2"><div><p className="text-xs text-slate-500">Chief concern</p><p className="mt-1 text-sm font-medium">Sore throat and mild fever</p></div><div><p className="text-xs text-slate-500">Status</p><p className="mt-1 flex items-center gap-2 text-sm font-medium text-green-700"><FileText className="h-4 w-4" /> Report available</p></div></div>
          <Link href={destination} className="block border-t border-slate-200 pt-4 text-right text-sm font-semibold text-[#087ea4] dark:border-slate-800">View record <ArrowRight className="ml-1 inline h-4 w-4" /></Link>
        </div>
      </section>
    </main>
  );
}

function SafetyCard({ icon, title, text, emergency = false }: { icon: React.ReactNode; title: string; text: string; emergency?: boolean }) {
  return <div className="border border-slate-200 p-5 dark:border-slate-800"><div className={`flex h-9 w-9 items-center justify-center rounded-lg ${emergency ? "bg-red-50 text-red-600 dark:bg-red-950/40" : "bg-[#e6f4f8] text-[#087ea4] dark:bg-cyan-950/50"}`}>{icon}</div><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{text}</p></div>;
}
