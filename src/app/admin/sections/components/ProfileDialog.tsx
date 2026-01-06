// c:\Users\Nath\Documents\Enrollment System\enrollment-system\src\app\admin\sections\components\ProfileDialog.tsx

import { memo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StudentDossier } from "./StudentDossier"

export const ProfileDialog = memo(function ProfileDialog({ open, onOpenChange, student, onOpenFile, isDarkMode }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        // 🟢 FIX 1: Removed inline backgroundColor style. 
        // Using Tailwind bg-white dark:bg-slate-950 ensures it follows the theme instantly.
        className="w-[95vw] md:w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[32px] md:rounded-[48px] p-0 border-none shadow-2xl transition-colors duration-500 bg-white dark:bg-slate-950 [&>button]:hidden"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Identity Profile</DialogTitle>
        </DialogHeader>
        {student && (
          <StudentDossier 
            student={student} 
            onOpenFile={onOpenFile} 
            isDarkMode={isDarkMode} 
            // 🟢 FIX 2: Connect the X button to the Dialog's state
            onClose={() => onOpenChange(false)} 
          />
        )}
      </DialogContent>
    </Dialog>
  )
})