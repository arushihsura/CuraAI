"use client"
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import AddNewSessionDialog from './AddNewSessionDialog'
import axios from 'axios'
import HistoryTable from './HistoryTable'
import { SessionDetail } from '../medical-agent/[sessionId]/page'
function HistoryList() {
    const [historyList,setHistoryList]=useState<SessionDetail[]>([])
    useEffect(() => {
      GetHistoryList();
    }, []);

    const GetHistoryList=async()=>{
      const result=await axios.get('/api/session-chat?sessionId=all');
      console.log(result.data);
      setHistoryList(result.data);
      
    }

  return (
    <div className='mt-8'>
      {historyList.length===0?
       <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900'>
         <Image src="/medicalassistance.svg" alt="empty history" width={150} height={150} />
         <h2 className='mt-5 text-xl font-semibold'>No recent consultations</h2>
         <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">It looks like you haven&apos;t had any consultations yet.</p>
        <AddNewSessionDialog />
       </div>:
       <div><HistoryTable historyList={historyList} /></div>

    }

    </div>
  )
}

export default HistoryList
