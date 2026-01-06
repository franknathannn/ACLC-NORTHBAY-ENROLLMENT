// src/app/admin/applicants/components/StatusBadge.tsx

import { memo } from "react"

export const StatusBadge = memo(({ status, isDarkMode }: { status: string, isDarkMode: boolean }) => {
  const styles: any = { Pending: isDarkMode ? "dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" : "bg-amber-50 text-amber-600 border-amber-200", Accepted: isDarkMode ? "dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20" : "bg-green-50 text-green-600 border-green-200", Approved: isDarkMode ? "dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20" : "bg-green-50 text-green-600 border-green-200", Rejected: isDarkMode ? "dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20" : "bg-red-50 text-red-600 border-red-200" }
  return (<div className={`mt-6 px-6 py-2 rounded-full border-2 text-[10px] font-black uppercase tracking-[0.3em] w-fit ${styles[status]}`}>{status === 'Approved' ? 'Accepted' : status}</div>)
})

StatusBadge.displayName = "StatusBadge"
