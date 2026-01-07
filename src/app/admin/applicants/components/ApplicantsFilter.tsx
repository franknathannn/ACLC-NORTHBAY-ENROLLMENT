// src/app/admin/applicants/components/ApplicantsFilter.tsx
import { memo } from "react"
import { ArrowUpDown, ChevronDown, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ApplicantsFilterProps {
  isDarkMode: boolean
  filter: "Pending" | "Accepted" | "Rejected"
  setFilter: (filter: "Pending" | "Accepted" | "Rejected") => void
  students: any[]
  setSelectedIds: (ids: string[]) => void
  sortBy: string
  setSortBy: (sort: string) => void
  sortDropdownOpen: boolean
  setSortDropdownOpen: (open: boolean) => void
}

export const ApplicantsFilter = memo(({ 
  isDarkMode, filter, setFilter, students, setSelectedIds, sortBy, setSortBy, sortDropdownOpen, setSortDropdownOpen 
}: ApplicantsFilterProps) => {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full relative z-30">
      <div className={`flex items-center gap-1 p-1.5 rounded-[20px] w-full md:w-fit overflow-x-auto transition-all duration-500 border ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
        {(["Pending", "Accepted", "Rejected"] as const).map((tab) => {
          const isActive = filter === tab
          return (
            <button
              key={tab}
              onClick={() => { setFilter(tab); setSelectedIds([]); }}
              className={`relative px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ease-out whitespace-nowrap flex items-center gap-2 ${
                isActive 
                  ? 'bg-white text-blue-600 shadow-md shadow-blue-500/10 border border-slate-100 dark:bg-slate-800 dark:text-blue-400 dark:border-slate-700 scale-105'
                  : (isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700')
              }`}
            >
              {tab}
              <span className={`px-1.5 py-0.5 rounded-md text-[9px] leading-none transition-all duration-500 ${isActive ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 scale-110' : (isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')}`}>
                {students.filter(s => s.status === tab || (tab === 'Accepted' && s.status === 'Approved')).length}
              </span>
            </button>
          )
        })}
      </div>

      {/* SORTING DROPDOWN */}
      <div className="relative">
        <Button 
          onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
          className={`h-12 px-5 rounded-[20px] font-black uppercase text-[10px] tracking-widest border transition-all flex items-center gap-2 shadow-lg ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          <ArrowUpDown size={14} className="text-blue-500" />
          <span className="hidden sm:inline">
            {sortBy === 'alpha' ? 'Alphabetical (Surname)' : 
             sortBy === 'date_new' ? 'Last To Enroll' : 
             sortBy === 'date_old' ? 'First To Enroll' : 
             sortBy === 'age' ? 'Age Based' : 
             sortBy === 'gender' ? 'Gender-Based' : 
             sortBy === 'strand_ict' ? 'ICT Priority' : 
             sortBy === 'strand_gas' ? 'GAS Priority' : 
             sortBy === 'gwa_desc' ? 'GWA Descending' : 
             sortBy === 'gwa_asc' ? 'GWA Ascending' : 'Alphabetical (First Name)'}
          </span>
          <ChevronDown size={14} className={`transition-transform duration-300 ${sortDropdownOpen ? 'rotate-180' : ''}`} />
        </Button>

        {sortDropdownOpen && (
          <div className={`absolute top-full left-0 md:left-auto md:right-0 mt-2 w-56 rounded-2xl shadow-2xl border overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'}`}>
            <div className="p-1.5 space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
              {[
                { id: 'alpha', label: 'Alphabetical (Surname)' },
                { id: 'date_old', label: 'First To Enroll' },
                { id: 'date_new', label: 'Last To Enroll' },
                { id: 'age', label: 'Age Based' },
                { id: 'gender', label: 'Gender-Based' },
                { id: 'strand_ict', label: 'ICT Strand / GAS' },
                { id: 'strand_gas', label: 'GAS Strand / ICT' },
                { id: 'gwa_desc', label: 'GWA Descending' },
                { id: 'gwa_asc', label: 'GWA Ascending' },
                { id: 'alpha_first', label: 'Alphabetical (First Name)' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { setSortBy(opt.id); setSortDropdownOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors text-left ${sortBy === opt.id ? (isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600') : (isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')}`}
                >
                  {opt.label}
                  {sortBy === opt.id && <CheckCircle2 size={12} />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
})
ApplicantsFilter.displayName = "ApplicantsFilter"
