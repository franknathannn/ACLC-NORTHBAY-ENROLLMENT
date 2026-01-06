// src/app/admin/applicants/components/ApplicantModals.tsx
import { memo } from "react"
import { AlertTriangle, Trash2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { themeColors } from "@/lib/themeColors"

export const QUICK_REASONS = [
  "Blurry 2x2 Photo",
  "Invalid LRN / Not Found",
  "Missing Grade 10 Report Card",
  "Incorrect Strand Selection",
  "Incomplete Guardian Details"
];

interface ApplicantModalsProps {
  isDarkMode: boolean
  declineModalOpen: boolean
  setDeclineModalOpen: (open: boolean) => void
  activeDeclineStudent: any
  declineReason: string
  setDeclineReason: (reason: string) => void
  handleExit: (id: string, callback: () => void) => void
  handleStatusChange: (id: string, name: string, status: string, reason?: string) => void
  
  bulkDeclineModalOpen: boolean
  setBulkDeclineModalOpen: (open: boolean) => void
  selectedIds: string[]
  students: any[]
  processBulkUpdate: (status: string, reason?: string) => void
  
  deleteModalOpen: boolean
  setDeleteModalOpen: (open: boolean) => void
  activeDeleteStudent: any
  handleConfirmDelete: () => void
  
  bulkDeleteModalOpen: boolean
  setBulkDeleteModalOpen: (open: boolean) => void
  processBulkDelete: () => void
}

export const ApplicantModals = memo(({
  isDarkMode,
  declineModalOpen, setDeclineModalOpen, activeDeclineStudent, declineReason, setDeclineReason, handleExit, handleStatusChange,
  bulkDeclineModalOpen, setBulkDeclineModalOpen, selectedIds, students, processBulkUpdate,
  deleteModalOpen, setDeleteModalOpen, activeDeleteStudent, handleConfirmDelete,
  bulkDeleteModalOpen, setBulkDeleteModalOpen, processBulkDelete
}: ApplicantModalsProps) => {
  return (
    <>
      {/* --- MODAL: DECLINE --- */}
      <Dialog open={declineModalOpen} onOpenChange={setDeclineModalOpen}>
        <DialogContent 
          className="rounded-[32px] w-[95vw] max-w-md p-0 overflow-hidden border-none shadow-2xl transition-colors duration-500"
          style={{ backgroundColor: isDarkMode ? themeColors.dark.surface : themeColors.light.surface }}
        >
          <div className="bg-gradient-to-br from-red-600 to-red-800 p-8 flex items-center gap-4 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner border border-white/10 shrink-0"><AlertTriangle size={24} /></div>
            <div className="relative z-10"><DialogTitle className="text-xl font-black uppercase tracking-tight leading-none text-white drop-shadow-sm">Admission Rejection</DialogTitle><DialogDescription className="text-red-100 text-xs mt-1 font-medium italic opacity-90">Record why this student was declined.</DialogDescription></div>
          </div>
          <div className="p-8 space-y-6">
            <div className={`flex items-center gap-4 p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
              <div className="h-10 w-10 rounded-xl bg-slate-200 overflow-hidden shrink-0 ring-2 ring-white dark:ring-slate-700 shadow-sm"><img src={activeDeclineStudent?.two_by_two_url || activeDeclineStudent?.profile_2x2_url || activeDeclineStudent?.profile_picture} className="w-full h-full object-cover" /></div>
              <div className="flex flex-col"><span className={`text-xs font-black uppercase leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{activeDeclineStudent?.first_name} {activeDeclineStudent?.last_name}</span><span className="text-[10px] font-bold text-slate-400 mt-1">LRN: {activeDeclineStudent?.lrn}</span></div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Quick Reasons</label>
              <div className="flex flex-wrap gap-2">
                {QUICK_REASONS.map(reason => (
                  <button 
                    key={reason} 
                    onClick={() => setDeclineReason(reason)} 
                    className={`px-3 py-1.5 rounded-lg border text-[9px] font-bold uppercase transition-all ${
                      declineReason === reason 
                        ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-500/30' 
                        : isDarkMode 
                          ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-red-500/50 hover:text-red-400' 
                          : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-red-200 hover:text-red-600'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <div className="pt-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Registrar Feedback</label>
                <Textarea 
                  placeholder="Provide specific feedback..." 
                  className={`min-h-[100px] mt-2 rounded-2xl focus:ring-red-600 font-bold text-sm resize-none ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-100 text-slate-900'}`} 
                  value={declineReason} 
                  onChange={(e) => setDeclineReason(e.target.value)} 
                />
              </div>
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-col"><Button onClick={() => handleExit(activeDeclineStudent.id, () => handleStatusChange(activeDeclineStudent.id, `${activeDeclineStudent.first_name} ${activeDeclineStudent.last_name}`, 'Rejected', declineReason || "Incomplete requirements."))} className="w-full h-14 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">Confirm Rejection</Button><Button variant="ghost" onClick={() => setDeclineModalOpen(false)} className={`w-full h-12 rounded-2xl font-black uppercase text-[10px] ${isDarkMode ? 'text-slate-500 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}>Cancel</Button></DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- MODAL: BULK DECLINE --- */}
      <Dialog open={bulkDeclineModalOpen} onOpenChange={setBulkDeclineModalOpen}>
        <DialogContent 
          className="rounded-[24px] md:rounded-[32px] w-[95vw] max-w-2xl p-0 overflow-hidden border-none shadow-2xl transition-colors duration-500 max-h-[90vh] flex flex-col"
          style={{ backgroundColor: isDarkMode ? themeColors.dark.surface : themeColors.light.surface }}
        >
          <div className="bg-gradient-to-br from-red-600 to-red-700 p-5 md:p-8 flex items-center gap-4 md:gap-5 text-white relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner border border-white/10 shrink-0">
              <AlertTriangle size={20} className="text-white drop-shadow-md md:w-7 md:h-7" />
            </div>
            <div className="relative z-10">
              <DialogTitle className="text-lg md:text-2xl font-black uppercase tracking-tight leading-none text-white drop-shadow-sm">Batch Rejection</DialogTitle>
              <DialogDescription className="text-red-100 text-[10px] md:text-xs mt-1 md:mt-1.5 font-bold uppercase tracking-widest opacity-90">
                Processing {selectedIds.length} applicants for removal
              </DialogDescription>
            </div>
          </div>

          <div className="p-5 md:p-8 space-y-6 md:space-y-8 overflow-y-auto custom-scrollbar">
            <div className={`rounded-2xl md:rounded-3xl border overflow-hidden transition-colors ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
              <div className={`px-4 md:px-6 py-3 md:py-4 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-100/50'}`}>
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500">Target List</p>
                <Badge variant="outline" className="text-[8px] md:text-[9px] h-5 border-slate-200 dark:border-slate-700 text-slate-400">{selectedIds.length} Selected</Badge>
              </div>
              <div className="max-h-[180px] md:max-h-[240px] overflow-y-auto custom-scrollbar p-2 md:p-3 space-y-2">
                {students.filter(s => selectedIds.includes(s.id)).map(student => (
                  <div key={student.id} className={`flex items-center gap-3 md:gap-4 p-2 md:p-3 rounded-xl md:rounded-2xl transition-all border ${isDarkMode ? 'hover:bg-slate-800 border-transparent hover:border-slate-700' : 'hover:bg-white border-transparent hover:border-slate-200 hover:shadow-sm'}`}>
                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-slate-200 overflow-hidden shrink-0 ring-2 ring-white dark:ring-slate-700 shadow-sm">
                      <img src={student.two_by_two_url || student.profile_2x2_url || student.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${student.last_name}`} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className={`text-[10px] md:text-xs font-black uppercase leading-none truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{student.first_name} {student.last_name}</span>
                      <span className="text-[8px] md:text-[9px] font-bold text-slate-400 mt-0.5 md:mt-1 tracking-wider">LRN: {student.lrn}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Reason for Rejection</label>
                <span className="text-[8px] md:text-[9px] font-bold text-red-500 uppercase tracking-wider opacity-80">Required</span>
              </div>
              
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {QUICK_REASONS.map(reason => (
                  <button 
                    key={reason} 
                    onClick={() => setDeclineReason(reason)} 
                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl border text-[8px] md:text-[9px] font-bold uppercase tracking-wide transition-all ${
                      declineReason === reason 
                        ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-500/30 transform scale-105' 
                        : isDarkMode 
                          ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-red-500/50 hover:text-red-400' 
                          : 'bg-white border-slate-200 text-slate-500 hover:border-red-200 hover:text-red-600 hover:bg-red-50'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              
              <div className="pt-1 md:pt-2 relative">
                <Textarea 
                  placeholder="Provide specific feedback regarding the rejection..." 
                  className={`min-h-[100px] md:min-h-[120px] rounded-2xl md:rounded-3xl p-4 md:p-5 font-bold text-xs md:text-sm resize-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-0 transition-all ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-600' 
                      : 'bg-slate-50 border-slate-100 text-slate-900 placeholder:text-slate-400'
                  }`} 
                  value={declineReason} 
                  onChange={(e) => setDeclineReason(e.target.value)} 
                />
                <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 pointer-events-none">
                  <FileText size={12} className={`md:w-3.5 md:h-3.5 ${isDarkMode ? "text-slate-700" : "text-slate-300"}`} />
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col gap-2 md:gap-3 sm:flex-col pt-2">
              <Button 
                onClick={() => processBulkUpdate('Rejected', declineReason || "Incomplete requirements.")} 
                className="w-full h-12 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black uppercase text-[10px] md:text-[11px] tracking-[0.2em] shadow-xl shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Confirm Batch Rejection
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setBulkDeclineModalOpen(false)} 
                className={`w-full h-10 md:h-12 rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-widest ${isDarkMode ? 'text-slate-500 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
              >
                Cancel Operation
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- MODAL: DELETE --- */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent 
          className="rounded-[32px] w-[95vw] max-w-md p-0 overflow-hidden border-none shadow-2xl transition-colors duration-500"
          style={{ backgroundColor: isDarkMode ? themeColors.dark.surface : themeColors.light.surface }}
        >
          <div className="bg-gradient-to-br from-red-600 to-red-800 p-8 flex items-center gap-4 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner border border-white/10 shrink-0"><Trash2 size={24} /></div>
            <div className="relative z-10"><DialogTitle className="text-xl font-black uppercase tracking-tight leading-none text-white drop-shadow-sm">Record Deletion</DialogTitle><DialogDescription className="text-red-100 text-xs mt-1 font-medium italic opacity-90">This action is irreversible.</DialogDescription></div>
          </div>
          <div className="p-8 space-y-6 text-center">
            <div className={`p-6 rounded-[32px] border ${isDarkMode ? 'bg-red-900/20 border-red-900/30' : 'bg-red-50 border-red-100'}`}>
              <p className={`text-sm font-bold leading-relaxed text-center ${isDarkMode ? 'text-red-200' : 'text-red-900'}`}>Are you sure you want to permanently erase <br/><span className="underline decoration-2 underline-offset-4">{activeDeleteStudent?.first_name} {activeDeleteStudent?.last_name}</span>?</p>
              <p className="text-[10px] font-black uppercase text-red-500 mt-2 tracking-widest leading-relaxed">This will purge all documents and database entries.</p>
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button onClick={() => handleExit(activeDeleteStudent.id, handleConfirmDelete)} className="w-full h-14 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">Delete Permanently</Button>
              <Button variant="ghost" onClick={() => setDeleteModalOpen(false)} className={`w-full h-12 rounded-2xl font-black uppercase text-[10px] ${isDarkMode ? 'text-slate-500 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}>Cancel</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- MODAL: BULK DELETE --- */}
      <Dialog open={bulkDeleteModalOpen} onOpenChange={setBulkDeleteModalOpen}>
        <DialogContent 
          className="rounded-[32px] w-[95vw] max-w-md p-0 overflow-hidden border-none shadow-2xl transition-colors duration-500"
          style={{ backgroundColor: isDarkMode ? themeColors.dark.surface : themeColors.light.surface }}
        >
          <div className="bg-gradient-to-br from-red-600 to-red-800 p-8 flex items-center gap-4 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner border border-white/10 shrink-0"><Trash2 size={24} /></div>
            <div className="relative z-10"><DialogTitle className="text-xl font-black uppercase tracking-tight leading-none text-white drop-shadow-sm">Batch Deletion</DialogTitle><DialogDescription className="text-red-100 text-xs mt-1 font-medium italic opacity-90">Permanently remove {selectedIds.length} records.</DialogDescription></div>
          </div>
          <div className="p-8 space-y-6 text-center">
            <div className={`p-6 rounded-[32px] border ${isDarkMode ? 'bg-red-900/20 border-red-900/30' : 'bg-red-50 border-red-100'}`}>
              <p className={`text-sm font-bold leading-relaxed text-center ${isDarkMode ? 'text-red-200' : 'text-red-900'}`}>Are you sure you want to permanently erase <br/><span className="text-lg font-black">{selectedIds.length}</span> selected applicants?</p>
              <p className="text-[10px] font-black uppercase text-red-500 mt-2 tracking-widest leading-relaxed">This will purge all documents and database entries.</p>
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button onClick={processBulkDelete} className="w-full h-14 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">Confirm Batch Deletion</Button>
              <Button variant="ghost" onClick={() => setBulkDeleteModalOpen(false)} className={`w-full h-12 rounded-2xl font-black uppercase text-[10px] ${isDarkMode ? 'text-slate-500 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}>Cancel</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
})
ApplicantModals.displayName = "ApplicantModals"
