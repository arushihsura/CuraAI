import React from "react";
import HistoryList from "./_components/HistoryList";
import DoctorsAgentList from "./_components/DoctorsAgentList";
import AddNewSessionDialog from "./_components/AddNewSessionDialog";
import UpcomingFollowUps from "./_components/UpcomingFollowUps";
import Link from "next/link";
import { FileSearch } from "lucide-react";

const Dashboard = () => {
  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#087ea4]">Overview</p>
        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">How can we help today?</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Start an assessment or review your recent health record.</p>
          </div>
          <AddNewSessionDialog />
        </div>
      </div>
      <Link href="/dashboard/documents" className="mb-8 flex items-center gap-4 border border-[#b9dfe9] bg-[#eaf7fa] p-5 transition hover:border-[#087ea4] dark:border-cyan-950 dark:bg-cyan-950/20">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-[#087ea4] shadow-sm dark:bg-slate-900 dark:text-cyan-300">
          <FileSearch className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">Understand a medical report</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Upload a lab result and get a simple, educational explanation.</p>
        </div>
      </Link>
       <HistoryList />
       <UpcomingFollowUps />
       <DoctorsAgentList />
    </div>
  );
};

export default Dashboard;
