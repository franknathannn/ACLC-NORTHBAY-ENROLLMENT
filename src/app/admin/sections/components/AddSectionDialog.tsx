// c:\Users\Nath\Documents\Enrollment System\enrollment-system\src\app\admin\sections\components\AddSectionDialog.tsx

import { memo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { themeColors } from "@/lib/themeColors"

export const AddSectionDialog = memo(function AddSectionDialog({ open, onOpenChange, strand, onConfirm, isProcessing, isDarkMode }: any) {
  return (
    <Dialog 
      open={open} 
      onOpenChange={onOpenChange}
    >
      <DialogContent 
        className="w-[95vw] md:w-full max-w-sm rounded-[32px] p-8 border-none shadow-2xl transition-colors duration-500"
        style={{ backgroundColor: isDarkMode ? themeColors.dark.surface : themeColors.light.surface }}
      >
         <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900">
              Create New Matrix?
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">
               Adding a new {strand} section will expand the total capacity.
            </DialogDescription>
         </DialogHeader>
         <DialogFooter className="mt-6 gap-2 sm:gap-0">
            <Button 
              onClick={() => onOpenChange(false)} 
              variant="ghost" 
              className="rounded-xl font-black uppercase text-[10px] text-slate-400"
            >
              Cancel
            </Button>
            <Button 
              onClick={onConfirm} 
              disabled={isProcessing}
              className="rounded-xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest px-6"
            >
              Confirm Creation
            </Button>
         </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
