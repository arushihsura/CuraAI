import { PricingTable } from '@clerk/nextjs'
import React from 'react'

function Billing() {
  return (
    <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#087ea4]">CuraAi Plus</p>
        <h2 className='mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white'>Choose your care plan</h2>
        <p className="mt-2 mb-8 text-sm text-slate-500 dark:text-slate-400">Unlock more specialist conversations and make your care routine more consistent.</p>
      <div className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <PricingTable />
    </div>
    </div>
  )
}

export default Billing
