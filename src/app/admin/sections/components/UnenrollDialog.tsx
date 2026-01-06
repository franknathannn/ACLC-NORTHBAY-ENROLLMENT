// c:\Users\Nath\Documents\Enrollment System\enrollment-system\src\app\admin\sections\components\UnenrollDialog.tsx

import { memo } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { themeColors } from "@/lib/themeColors"

export const UnenrollDialog = memo(function UnenrollDialog({ open, onOpenChange, student, onConfirm, isDarkMode }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[95vw] md:w-full max-w-md rounded-[32px] p-0 overflow-hidden border-none shadow-2xl z-[10000] transition-colors duration-500"
        style={{ backgroundColor: isDarkMode ? themeColors.dark.surface : themeColors.light.surface }}
      >
        <div className="bg-gradient-to-br from-red-600 to-red-800 p-8 flex items-center gap-4 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner border border-white/10 shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div className="relative z-10">
            <DialogTitle className="text-xl font-black uppercase tracking-tight leading-none text-white drop-shadow-sm">Confirm Purge</DialogTitle>
            <DialogDescription className="text-red-100 text-xs mt-1 font-medium italic opacity-90">Permanent Database Deletion</DialogDescription>
          </div>
        </div>

        <div className="p-8 space-y-6 text-center">
           <div className={`p-6 rounded-[32px] border ${isDarkMode ? 'bg-red-900/20 border-red-900/30' : 'bg-red-50 border-red-100'}`}>
              <p className={`text-sm font-bold leading-relaxed ${isDarkMode ? 'text-red-200' : 'text-red-900'}`}>
                Are you sure you want to permanently erase <br/>
                <span className="text-lg uppercase font-black underline decoration-2">
                  {student?.last_name}, {student?.first_name}
                </span>?
              </p>
              <p className="text-[10px] font-black uppercase text-red-500 mt-4 tracking-widest">
                Student data will be removed from all matrices.
              </p>
           </div>
           <DialogFooter className="flex-col sm:flex-col gap-2">
              <Button 
                onClick={onConfirm} 
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Execute Database Purge
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => onOpenChange(false)} 
                className="w-full h-12 rounded-2xl text-slate-400 font-black uppercase text-[10px]"
              >
                Cancel
              </Button>
           </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
})
