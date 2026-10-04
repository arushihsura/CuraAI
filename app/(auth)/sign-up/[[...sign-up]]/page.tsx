import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
   <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-10 dark:bg-slate-950">
    <SignUp />
   </div>
  )
}