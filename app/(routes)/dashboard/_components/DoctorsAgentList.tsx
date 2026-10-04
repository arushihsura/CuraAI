import { AIDoctorAgents } from '@/shared/list'
import { index } from 'drizzle-orm/gel-core'
import React from 'react'
import DoctorAgentCard from './DoctorAgentCard'

function DoctorsAgentList() {
  return (
    <div className='mt-10 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900'>
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Your care team</p>
        <h2 className='mt-2 text-xl font-semibold'>AI specialists available</h2>
      </div>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'>
        {AIDoctorAgents.map((doctor,index)=>(
          <div key={index} className='rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:border-cyan-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-950'>
            <DoctorAgentCard doctorAgent={doctor} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default DoctorsAgentList
