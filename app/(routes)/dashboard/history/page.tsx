import React from 'react'
import HistoryList from '../_components/HistoryList'
function page() {
  return (
    <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#087ea4]">Consultations</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Previous consultations</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Review summaries and recommendations from your past conversations.</p>
        <HistoryList />
      
    </div>
  )
}

export default page
