import React from 'react'
import AppHeader from './_components/AppHeader';

function DashboardLayout ({
    
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 dark:bg-slate-950 dark:text-white">
      <AppHeader />
      <main className='mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10'>
        {children}
      </main>
      
    </div>
  )
}

export default DashboardLayout
