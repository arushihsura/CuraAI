"use client";

import { CalendarClock, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";

type FollowUp = {
  id: number;
  scheduledFor: string;
  reason: string;
  status: string;
};

export default function UpcomingFollowUps() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFollowUps = async () => {
      try {
        const response = await axios.get<FollowUp[]>("/api/followups");
        setFollowUps(response.data);
      } catch (error) {
        console.error("Failed to load follow-ups:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFollowUps();
  }, []);

  if (loading) {
    return (
      <div className="mt-8 flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading follow-ups...
      </div>
    );
  }

  if (followUps.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 rounded-xl border border-cyan-100 bg-cyan-50/60 p-5 dark:border-cyan-950 dark:bg-cyan-950/20 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-cyan-700 shadow-sm dark:bg-slate-900 dark:text-cyan-300">
          <CalendarClock className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
            Stay on track
          </p>
          <h2 className="mt-1 text-xl font-semibold">Upcoming follow-ups</h2>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {followUps.map((followUp) => (
          <div
            key={followUp.id}
            className="rounded-lg border border-white/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-sm font-semibold">
              {new Intl.DateTimeFormat(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              }).format(new Date(followUp.scheduledFor))}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {followUp.reason}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
