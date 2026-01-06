// src/app/admin/applicants/components/ApplicantsHeader.tsx
import { memo } from "react"
import { Search, RefreshCw, FileDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemedCard } from "@/components/ThemedCard"
import { ThemedText } from "@/components/ThemedText"

interface ApplicantsHeaderProps {
  isDarkMode: boolean
  loading: boolean
  config: any
  searchTerm: string
  setSearchTerm: (term: string) => void
  fetchStudents: (isBackground?: boolean) => void
  exportToCSV: () => void
}

export const ApplicantsHeader = memo(({ 
  isDarkMode, loading, config, searchTerm, setSearchTerm, fetchStudents, exportToCSV 
}: ApplicantsHeaderProps) => {
  return (
    <ThemedCard 
      className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6 p-6 md:p-8 rounded-[32px] backdrop-blur-sm transition-colors duration-500 border"
      style={{ 
        backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : '#ffffff',
        borderColor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : '#f1f5f9'
      }}
    >
      <div className="w-full md:w-auto">
        <ThemedText variant="h1" className={`text-3xl md:text-5xl animate-in slide-in-from-left duration-500 ${isDarkMode ? 'text-white' : 'text-slate-900'}`} isDarkMode={isDarkMode}>Admissions</ThemedText>
        <ThemedText variant="body" className="italic mt-2 text-xs md:text-sm lg:text-base flex items-center gap-2" isDarkMode={isDarkMode}>
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Student Enrollment Queue S.Y. {config?.school_year || "..."}
        </ThemedText>
      </div>
      
      <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto flex-wrap">
        <Button 
          onClick={() => fetchStudents(false)} 
          variant="ghost" 
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-12 w-12 p-0 rounded-2xl text-slate-400 hover:text-blue-600 hover:bg-blue-50"
        >
          <RefreshCw className={loading ? "animate-spin" : ""} size={18} />
        </Button>
        <div className="relative flex-1 min-w-[200px] md:min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
          <Input 
            placeholder="Search LRN or Name..." 
            className="h-10 md:h-12 pl-10 w-full rounded-2xl bg-white dark:bg-slate-900/90 backdrop-blur-sm shadow-lg border font-bold text-sm text-black dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all duration-500" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ backgroundColor: isDarkMode ? undefined : '#ffffff', color: isDarkMode ? undefined : '#000000', borderColor: isDarkMode ? 'rgba(51, 65, 85, 0.5)' : '#f1f5f9' }}
          />
        </div>
        <Button 
          onClick={exportToCSV} 
          className="h-10 md:h-12 px-3 md:px-6 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white font-black uppercase text-[10px] tracking-widest hover:from-blue-600 hover:to-blue-700 transition-all shadow-xl shadow-blue-500/20 shrink-0 transform hover:scale-105 flex items-center justify-center gap-2 border border-slate-700/50"
        >
          <FileDown size={16} />
          <span className="hidden sm:inline">Export CSV</span>
        </Button>
      </div>
    </ThemedCard>
  )
})
ApplicantsHeader.displayName = "ApplicantsHeader"
