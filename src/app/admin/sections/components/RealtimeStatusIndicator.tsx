// c:\Users\Nath\Documents\Enrollment System\enrollment-system\src\app\admin\sections\components\RealtimeStatusIndicator.tsx

import { memo } from "react"

export const RealtimeStatusIndicator = memo(function RealtimeStatusIndicator({ status, lastUpdate }: { status: string, lastUpdate: string }) {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 animate-in slide-in-from-bottom-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status.includes('🟢') ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest">{status}</span>
        </div>
        {lastUpdate && (
          <>
            <div className="w-px h-4 bg-white/20" />
            <span className="text-[9px] font-bold text-slate-400">{lastUpdate}</span>
          </>
        )}
      </div>
    </div>
  )
})
