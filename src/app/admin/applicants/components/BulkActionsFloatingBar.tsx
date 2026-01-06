// src/app/admin/applicants/components/BulkActionsFloatingBar.tsx
import { memo } from "react"
import { CheckCircle2, XCircle, ListRestart, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BulkActionsFloatingBarProps {
  selectedIds: string[]
  filter: "Pending" | "Accepted" | "Rejected"
  handleBulkAction: (status: string) => void
  setBulkDeleteModalOpen: (open: boolean) => void
  setSelectedIds: (ids: string[]) => void
}

export const BulkActionsFloatingBar = memo(({ 
  selectedIds, filter, handleBulkAction, setBulkDeleteModalOpen, setSelectedIds 
}: BulkActionsFloatingBarProps) => {
  if (selectedIds.length === 0) return null

  return (
    <div className="fixed bottom-4 md:bottom-10 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500 max-w-4xl md:mx-auto">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-4 md:px-8 py-3 md:py-4 rounded-[32px] shadow-2xl shadow-blue-500/20 flex flex-col md:flex-row items-center gap-4 md:gap-8 border border-white/20 backdrop-blur-xl ring-2 ring-blue-500/10">
        <div className="flex flex-col text-center md:text-left"><span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Batch Matrix control</span><span className="text-sm font-black tracking-tight">{selectedIds.length} Selected</span></div>
        <div className="hidden md:block h-8 w-[1px] bg-white/10" />
        <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
          {filter === 'Pending' && (
            <>
              <Button onClick={() => handleBulkAction('Accepted')} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl font-black text-[10px] uppercase h-10 md:h-11 px-4 md:px-6 shadow-lg shadow-green-500/20 transition-all transform hover:scale-105">
                <CheckCircle2 size={14} className="mr-1 md:mr-2"/> <span className="hidden sm:inline">Mass Approve</span><span className="sm:hidden">Approve</span>
              </Button>
              <Button onClick={() => handleBulkAction('Rejected')} className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl font-black text-[10px] uppercase h-10 md:h-11 px-4 md:px-6 shadow-lg shadow-red-500/20 transition-all transform hover:scale-105">
                <XCircle size={14} className="mr-1 md:mr-2"/> <span className="hidden sm:inline">Mass Reject</span><span className="sm:hidden">Reject</span>
              </Button>
            </>
          )}
          {(filter === 'Accepted' || filter === 'Rejected') && (
            <Button onClick={() => handleBulkAction('Pending')} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl font-black text-[10px] uppercase h-10 md:h-11 px-4 md:px-6 shadow-lg shadow-amber-500/20 transition-all transform hover:scale-105">
              <ListRestart size={14} className="mr-1 md:mr-2"/> <span className="hidden sm:inline">Reset to Pending</span><span className="sm:hidden">Reset</span>
            </Button>
          )}
          {filter === 'Rejected' && (
            <Button onClick={() => setBulkDeleteModalOpen(true)} className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl font-black text-[10px] uppercase h-10 md:h-11 px-4 md:px-6 shadow-lg shadow-red-500/20 transition-all transform hover:scale-105">
              <Trash2 size={14} className="mr-1 md:mr-2"/> <span className="hidden sm:inline">Mass Deletion</span><span className="sm:hidden">Delete</span>
            </Button>
          )}
          <Button onClick={() => setSelectedIds([])} variant="ghost" className="text-slate-400 hover:text-white font-black text-[10px] uppercase h-10 md:h-11 px-4 transition-all hover:bg-white/10">Cancel</Button>
        </div>
      </div>
    </div>
  )
})
BulkActionsFloatingBar.displayName = "BulkActionsFloatingBar"
