// c:\Users\Nath\Documents\Enrollment System\enrollment-system\src\app\admin\sections\components\SectionDetailView.tsx

import { memo } from "react"
import { Loader2, ArrowLeft, RefreshCw, Search, FileDown, LayoutGrid, GraduationCap, Users2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { StudentTable } from "./StudentTable"

export const SectionDetailView = memo(function SectionDetailView({
  sectionName,
  currentSection,
  activeStudents,
  capacity,
  fillPercent,
  config,
  isDarkMode,
  onBack,
  onRefresh,
  loading,
  searchTerm,
  setSearchTerm,
  onExport,
  sortedStudents,
  mCount,
  fCount,
  debouncedSearch,
  sections,
  handleReturnToPending,
  handleUnenroll,
  handleSwitch,
  handleOpenFile,
  handleViewProfile,
  exitingRows,
  hiddenRows,
  handleExit,
  animatingIds
}: any) {
  
  const isICT = currentSection?.strand === 'ICT';
  
  // Theme Variables - Enhanced for Crystalline Vibrancy
  const strandGradient = isICT 
    ? 'from-[#020617] via-[#0f172a] to-[#020617]' 
    : 'from-[#1a0b0b] via-[#381102] to-[#1a0b0b]';

  const accentColor = isICT ? 'bg-blue-600' : 'bg-orange-600';
  const shadowColor = isICT ? 'shadow-blue-900/40' : 'shadow-orange-900/40';

  if (!currentSection) return (
      <div className="h-96 flex flex-col items-center justify-center gap-4 text-slate-400">
         <Loader2 className={`animate-spin w-12 h-12 stroke-[1] ${isDarkMode ? 'text-blue-500' : 'text-blue-600'}`} />
         <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.6em] mb-1 opacity-40">System Sync</p>
            <p className="text-[9px] font-bold text-slate-500 italic">ACCESSING MATRIX TERMINAL...</p>
         </div>
      </div>
  )

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-1000 ease-out">
      {/* 🧭 NAVIGATION & TOOLS BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
        <Button 
          variant="ghost" 
          onClick={onBack} 
          className={`rounded-full font-black text-[10px] uppercase tracking-widest transition-all hover:bg-slate-500/10 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
        >
          <ArrowLeft className="mr-3" size={14} strokeWidth={3}/> Section Node
        </Button>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Button 
            onClick={onRefresh} 
            className={`h-11 w-11 p-0 rounded-full border bg-transparent backdrop-blur-xl shadow-sm transition-all hover:rotate-180 active:scale-90 ${isDarkMode ? 'text-slate-400 border-slate-800' : 'text-slate-400 border-slate-200'}`}
          >
            <RefreshCw className={loading ? "animate-spin" : ""} size={18}/>
          </Button>
          
          <div className="relative flex-1 md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <Input
              placeholder="Search Subject ID..." 
              className={`pl-12 rounded-full h-11 text-xs font-bold border-none shadow-inner transition-all focus-visible:ring-2 focus-visible:ring-slate-400/20 ${
                isDarkMode ? 'bg-slate-900/50 text-white' : 'bg-white/80 text-slate-900'
              }`} 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />                
          </div>
          
          <Button 
            onClick={() => onExport(sectionName, sortedStudents)} 
            className="rounded-full bg-slate-950 text-white font-black uppercase text-[9px] tracking-[0.2em] h-11 px-8 hover:bg-white hover:text-black transition-all active:scale-95 shadow-2xl"
          >
            <FileDown size={14} className="mr-3" /> Get Masterlist
          </Button>
        </div>
      </div>

      {/* 🏙️ SECTION IDENTITY HEADER - FIXED: Shadow reduced & Bleed shielding applied */}
      <div className={`p-8 md:p-16 rounded-[60px] text-white relative overflow-hidden transition-all duration-1000 isolate z-10 bg-clip-padding shadow-xl outline outline-1 outline-transparent ${
          isDarkMode ? 'bg-black border border-white/5' : `bg-gradient-to-br ${strandGradient}`
        }`}>
        
        <div className={`absolute -top-24 -left-24 w-[500px] h-[500px] blur-[140px] opacity-30 rounded-full mix-blend-screen pointer-events-none ${isICT ? 'bg-blue-900' : 'bg-orange-900'}`} />
        <div className={`absolute bottom-0 right-0 w-[400px] h-[400px] blur-[160px] opacity-10 rounded-full pointer-events-none ${isICT ? 'bg-cyan-500' : 'bg-amber-600'}`} />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
           <div className="space-y-8">
              <div className="flex items-center gap-4">
                 {/* FIXED: Sub-pixel shielding for Badge */}
                 <Badge className="bg-slate-900/40 backdrop-blur-3xl text-white/80 border border-white/5 px-5 py-2 rounded-full font-black text-[9px] uppercase tracking-[0.3em] bg-clip-padding outline outline-1 outline-transparent">
                   {currentSection.strand} FACULTY CORE
                 </Badge>
              </div>
              
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-[-0.07em] uppercase leading-none italic drop-shadow-2xl whitespace-nowrap break-keep transform-gpu">
                {sectionName}
              </h1>
              
              <div className="flex items-center gap-6 opacity-30">
                 <div className="flex items-center gap-2">
                    <GraduationCap size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{config?.school_year || "S.Y. 2025"}</span>
                 </div>
                 <div className="w-1 h-1 bg-white rounded-full" />
                 <p className="text-[10px] font-black uppercase tracking-widest">Registry Node</p>
              </div>
           </div>

           {/* The Soft Glass Card - FIXED: GPU stabilization and shadow reduction */}
           <div className="relative group isolate">
              <div className={`absolute inset-0 blur-3xl opacity-10 transition-opacity group-hover:opacity-20 ${accentColor}`} />
              
              <div className="relative backdrop-blur-[80px] bg-slate-950/50 p-10 md:p-12 rounded-[50px] border border-white/5 shadow-xl overflow-hidden transform-gpu bg-clip-padding outline outline-1 outline-transparent">
                <div className="flex justify-between items-start mb-10">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-4">Node Saturation</p>
                      <div className="flex items-baseline gap-3">
                         <span className="text-6xl md:text-7xl font-black tracking-tighter tabular-nums">{activeStudents.length}</span>
                         <span className="text-white/20 font-black text-xl tracking-tighter uppercase">/ {capacity}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-white/5 bg-black/20`}>
                         <Users2 className={isICT ? 'text-blue-400' : 'text-orange-400'} size={24} />
                      </div>
                    </div>
                </div>

                <div className="space-y-5">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                     <span className="opacity-30">Registry Flow</span>
                     <span className={isICT ? 'text-blue-400' : 'text-orange-400'}>{Math.round(fillPercent)}% Complete</span>
                  </div>
                  
                  <div className="relative h-2.5 w-full bg-black/40 rounded-full overflow-hidden shadow-inner isolate">
                    {/* Male Bar (Left) */}
                    <div className="absolute left-0 top-0 bottom-0 h-full bg-blue-500 transition-all duration-1000 ease-out" style={{ width: `${(mCount / capacity) * 100}%` }} />
                    {/* Female Bar (Right) */}
                    <div className="absolute right-0 top-0 bottom-0 h-full bg-pink-500 transition-all duration-1000 ease-out" style={{ width: `${(fCount / capacity) * 100}%` }} />
                  </div>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* 📊 BEAUTIFIED FILTER TABS (Dock System) */}
      <Tabs defaultValue="all" className="w-full">
        <div className="flex justify-center mb-16 px-4">
          <TabsList 
            className={`p-1.5 h-auto rounded-full border backdrop-blur-3xl transition-all duration-500 shadow-xl flex items-center gap-0 bg-clip-padding outline outline-1 outline-transparent ${
              isDarkMode ? 'bg-slate-900/60 border-white/5' : 'bg-white/60 border-slate-200'
            }`}
          >                
            <TabsTrigger 
              value="all" 
              className={`rounded-full px-8 md:px-12 py-3.5 font-black uppercase text-[10px] tracking-[0.15em] transition-all duration-300 flex items-center gap-3 data-[state=active]:text-white data-[state=active]:shadow-lg ${isICT ? 'data-[state=active]:bg-blue-600' : 'data-[state=active]:bg-orange-600'} hover:text-slate-400`}
            >
              Master List <span className="text-[11px] font-mono opacity-40">[{activeStudents.length}]</span>
            </TabsTrigger>
            
            <div className={`w-[1px] h-6 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
            
            <TabsTrigger 
              value="males" 
              className={`rounded-full px-8 md:px-12 py-3.5 font-black uppercase text-[10px] tracking-[0.15em] transition-all duration-300 flex items-center gap-3 data-[state=active]:text-white data-[state=active]:shadow-lg ${isICT ? 'data-[state=active]:bg-blue-600' : 'data-[state=active]:bg-orange-600'} hover:text-slate-400`}
            >
              Male <span className="text-[11px] font-mono opacity-40">[{mCount}]</span>
            </TabsTrigger>

            <div className={`w-[1px] h-6 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />

            <TabsTrigger 
              value="females" 
              className={`rounded-full px-8 md:px-12 py-3.5 font-black uppercase text-[10px] tracking-[0.15em] transition-all duration-300 flex items-center gap-3 data-[state=active]:text-white data-[state=active]:shadow-lg ${isICT ? 'data-[state=active]:bg-blue-600' : 'data-[state=active]:bg-orange-600'} hover:text-slate-400`}
            >
              Female <span className="text-[11px] font-mono opacity-40">[{fCount}]</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {['all', 'males', 'females'].map((tab) => (
          <TabsContent 
            key={tab} 
            value={tab} 
            className="outline-none focus:ring-0 focus-visible:ring-0 mt-0 animate-in fade-in zoom-in-95 slide-in-from-bottom-10 duration-700 ease-out"
          >
            <StudentTable 
              students={sortedStudents.filter((s: any) => {
                const match = `${s.first_name} ${s.last_name}`.toLowerCase().includes(debouncedSearch.toLowerCase())
                if (tab === 'all') return match
                return match && s.gender === (tab === 'males' ? 'Male' : 'Female')
              })} 
              onReturn={handleReturnToPending} 
              onUnenroll={handleUnenroll}
              onSwitch={handleSwitch} 
              allSections={sections.filter((s: any) => s.strand === currentSection.strand)}
              onOpenFile={handleOpenFile}
              onViewProfile={handleViewProfile}
              isDarkMode={isDarkMode}
              exitingRows={exitingRows}
              hiddenRows={hiddenRows}
              handleExit={handleExit}
              animatingIds={animatingIds}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
})