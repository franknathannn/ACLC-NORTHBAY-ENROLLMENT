// c:\Users\Nath\Documents\Enrollment System\enrollment-system\src\app\admin\sections\components\ProcessingOverlay.tsx

import { memo } from "react"
import { Loader2 } from "lucide-react"

export const ProcessingOverlay = memo(function ProcessingOverlay() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-[10000] flex items-center justify-center">
      <div className="bg-slate-900 text-white p-10 rounded-[48px] flex items-center gap-6 shadow-2xl animate-in zoom-in-95 duration-300">
        <Loader2 className="animate-spin text-blue-400 w-8 h-8" />
        <span className="font-black uppercase text-sm tracking-[0.2em]">Updating Matrix Data...</span>
      </div>
    </div>
  )
})
