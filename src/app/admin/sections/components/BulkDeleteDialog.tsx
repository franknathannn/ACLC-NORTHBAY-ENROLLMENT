// c:\Users\Nath\Documents\Enrollment System\enrollment-system\src\app\admin\sections\components\BulkDeleteDialog.tsx

import { memo } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { themeColors } from "@/lib/themeColors"

export const BulkDeleteDialog = memo(function BulkDeleteDialog({ open, onOpenChange, count, onConfirm, isDarkMode }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent 
          className="w-[95vw] md:w-full max-w-md rounded-[32px] p-0 overflow-hidden border-none shadow-2xl transition-colors duration-500"
          style={{ backgroundColor: isDarkMode ? themeColors.dark.surface : themeColors.light.surface }}
       >
          <div className="bg-red-600 p-8 text-white">
            <DialogTitle className="text-xl font-black uppercase">
              Delete {count} Matrices?
            </DialogTitle>
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">
              This action cannot be undone.
            </p>
          </div>
          <div className="p-8 space-y-6">
             <p className="text-sm font-bold text-slate-600">
               You are about to delete <span className="text-red-600">{count}</span> sections. 
               This will shift the sequence of remaining sections.
             </p>
             <div className="flex gap-3">
               <Button 
                 onClick={() => onOpenChange(false)} 
                 variant="ghost" 
                 className="flex-1 rounded-xl font-black uppercase text-[10px]"
               >
                 Cancel
               </Button>
               <Button 
                 onClick={onConfirm} 
                 className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px]"
               >
                 Confirm Delete
               </Button>
             </div>
          </div>
       </DialogContent>
    </Dialog>
  )
})
