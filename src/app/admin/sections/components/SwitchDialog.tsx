// c:\Users\Nath\Documents\Enrollment System\enrollment-system\src\app\admin\sections\components\SwitchDialog.tsx

import { memo } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowRightLeft } from "lucide-react"

export const SwitchDialog = memo(function SwitchDialog({ student, allSections, onSwitch, isDarkMode, className }: any) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          className={className || "h-8 px-3 rounded-lg text-blue-400 font-black text-[9px] uppercase tracking-widest transition-colors group"}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgb(37 99 235)'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'rgb(96 165 250)'; }}
        >
          <ArrowRightLeft size={14} className="mr-1.5 group-hover:rotate-180 transition-transform duration-500" />
          Switch
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[32px] md:rounded-[40px] w-[95vw] md:w-full max-w-sm p-0 overflow-hidden border-none shadow-2xl bg-slate-900">
        <DialogHeader className="p-6 md:p-8 bg-blue-600 dark:bg-slate-900 text-white relative overflow-hidden flex flex-col items-center text-center">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/30 blur-[60px] rounded-full -mr-10 -mt-10 pointer-events-none" />
          
          <div className="relative z-10 w-full flex flex-col items-center">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-6 animate-in fade-in slide-in-from-top-2">
              Transferring Subject
            </p>
            
            <div className="w-24 h-24 rounded-full p-1.5 bg-gradient-to-b from-blue-500 to-indigo-600 shadow-2xl shadow-blue-500/30 mb-4 animate-in zoom-in duration-500">
               <img 
                 src={student.two_by_two_url || student.profile_2x2_url || student.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${student.last_name}`} 
                 alt="Student" 
                 className="w-full h-full object-cover rounded-full border-4 border-slate-900 bg-slate-800" 
               />
            </div>
            
            <DialogTitle className="text-xl font-black uppercase tracking-tight leading-none mb-1">
              {student.last_name}, {student.first_name}
            </DialogTitle>
            <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
              LRN: {student.lrn}
            </p>
          </div>
        </DialogHeader>
        
        <div className="p-4 space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar bg-slate-800">
          <p className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Select Destination Matrix
          </p>
          {allSections.map((sec: any) => {
            const isCurrent = student.section_id === sec.id
            const currentCount = sec.students?.filter((s: any) => s.status === 'Accepted' || s.status === 'Approved').length || 0
            const capacity = sec.capacity || 40
            const isFull = currentCount >= capacity
            
            return (
            <button 
              key={sec.id} 
              disabled={isCurrent || isFull}
              onClick={() => !isCurrent && !isFull && onSwitch(student.id, sec.section_name)} 
              className={`w-full group flex items-center justify-between p-3 md:p-4 rounded-2xl border transition-colors duration-300 relative overflow-hidden
                ${isCurrent || isFull
                  ? 'bg-slate-900/50 border-slate-800 opacity-60 cursor-not-allowed' 
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-500 hover:shadow-lg hover:-translate-y-0.5'
                }`}
            >
              <div className="flex items-center gap-4 relative z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-sm ${
                  isCurrent || isFull ? 'bg-slate-800 text-slate-700' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors'
                }`}>
                   {sec.section_name.substring(0, 1)}
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className={`font-black uppercase text-xs tracking-tight ${
                    isCurrent || isFull ? 'text-slate-400' : 'text-slate-900 dark:text-white'
                  }`}>
                    {sec.section_name}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">
                    Capacity: {currentCount}/{capacity}
                  </span>
                </div>
              </div>
              
              {isCurrent ? (
                 <div className="px-3 py-1 bg-slate-700 rounded-lg text-[8px] font-black uppercase text-slate-400 tracking-widest">
                   Current
                 </div>
              ) : isFull ? (
                 <div className="px-3 py-1 bg-red-100 dark:bg-red-900/20 rounded-lg text-[8px] font-black uppercase text-red-500 dark:text-red-400 tracking-widest">
                   FULL
                 </div>
              ) : (
                 <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <ArrowRightLeft size={14} />
                 </div>
              )}
            </button>
          )})}
        </div>
      </DialogContent>
    </Dialog>
  )
})
