// c:\Users\Nath\Documents\Enrollment System\enrollment-system\src\app\admin\sections\components\SectionGroup.tsx

import { memo, useMemo } from "react"
import { ChevronDown, ChevronUp, CheckSquare, Square, Cpu, BookOpen } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from "@/components/ui/table"
import { SectionCard } from "./SectionCard"


export const SectionGroup = memo(function SectionGroup({ 
  title, 
  mobileTitle,
  icon, 
  color, 
  sections, 
  load, 
  onSelect, 
  onDelete, 
  isExpanded, 
  onToggle, 
  selection, 
  onToggleSelect, 
  onSelectAll,
  isDarkMode, 
  config
}: any) {
  const colorMap: any = { 
    blue: "bg-blue-50 text-blue-600 border-blue-100", 
    orange: "bg-orange-50 text-orange-600 border-orange-100" 
  }

  const allIds = useMemo(() => sections.map((s: any) => s.id), [sections])
  const isAllSelected = sections.length > 0 && sections.every((s: any) => selection.has(s.id))
  
  return (
    <section className="space-y-6 overflow-hidden w-full">
      <div 
        onClick={onToggle} 
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 group cursor-pointer border-b pb-8 hover:border-slate-300 transition-colors" 
        style={{ borderColor: isDarkMode ? 'rgb(30 41 59)' : '#e2e8f0' }}
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className={`p-4 rounded-2xl transition-transform group-hover:rotate-12 duration-500 flex-shrink-0 ${colorMap[color]}`}>
            {icon}
          </div>
          <h2 
            className="text-lg md:text-2xl tracking-widest uppercase truncate flex-shrink min-w-0 font-black"
            style={{ color: isDarkMode ? '#ffffff' : '#000000' }}
          >
            <span className="hidden md:inline">{title}</span>
            <span className="inline md:hidden">{mobileTitle || title}</span>
          </h2>
          <Badge className={`${color === 'blue' ? 'bg-blue-600' : 'bg-orange-600'} text-white rounded-full px-4 py-1.5 font-black text-[10px] whitespace-nowrap flex-shrink-0`}>
            {sections.length}
          </Badge>
        </div>
        <div 
          className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-3 md:p-5 rounded-[24px] md:rounded-[32px] border-none dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-none w-full md:w-auto flex-shrink-0 relative bg-white dark:bg-slate-900" 
          style={{ backgroundColor: isDarkMode ? 'rgb(15 23 42)' : '#ffffff' }}
        >
          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
              <span>Strand Capacity </span>
              <span>({Math.round(load.percent)}%)</span>
            </div>
            <Progress 
              value={load.percent} 
              className={`h-2 [&>div]:transition-all [&>div]:duration-1000 ${
                color === 'blue' ? '[&>div]:bg-blue-600' : '[&>div]:bg-orange-600'
              }`} 
              style={{ backgroundColor: isDarkMode ? 'rgb(30 41 59)' : 'rgb(226 232 240)' }} 
            />
          </div>
          <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 pl-0 sm:pl-6 border-slate-100 dark:border-slate-800 w-full sm:w-auto">
            <p className="text-sm font-black" style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
              {load.totalEnrolled}/{load.totalCapacity}
            </p>
            <p className="text-[8px] font-bold text-slate-400 uppercase">Load Index</p>
          </div>
          <div className="text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors absolute top-5 right-5 sm:static">
            {isExpanded ? <ChevronDown size={20}/> : <ChevronUp size={20}/>}
          </div>
        </div>
      </div>
      
      <div className={`transition-all duration-300 ease-out ${
        isExpanded ? "opacity-100 max-h-[5000px] visible translate-y-0" : "opacity-0 max-h-0 invisible -translate-y-4 overflow-hidden"
      }`}>
        {sections.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-[40px] text-slate-300 font-bold uppercase text-xs tracking-widest">
            No Active Matrices Found
          </div>
        ) : (
          <>
            {/* MOBILE: Cards */}
            <div className="md:hidden grid grid-cols-1 gap-4 px-4">
              {sections.map((sec: any, index: number) => (
                <div 
                  key={sec.id} 
                  className="relative group animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-700 fill-mode-backwards" 
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                   <div className="absolute top-4 right-6 z-20">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onToggleSelect(sec.id); }} 
                        className="text-slate-400 hover:text-blue-600 transition-colors p-2 -m-2"
                      >
                         {selection.has(sec.id) ? (
                           <CheckSquare size={14} className="text-blue-600 fill-blue-50" />
                         ) : (
                           <Square size={14} />
                         )}
                      </button>
                   </div>
                   <div onClick={() => onSelect(sec.section_name)} className="cursor-pointer h-full w-full">
                      <SectionCard 
                        section={sec} 
                        isSelected={selection.has(sec.id)} 
                        isDarkMode={isDarkMode} 
                        config={config}
                      />
                   </div>
                </div>
              ))}
            </div>

            {/* DESKTOP: Table */}
            <div className="hidden md:block animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Table className="border-separate border-spacing-y-6 px-2">
                <TableHeader>
                  <TableRow className="border-none hover:bg-transparent mb-4">
                    <TableHead className="w-16 pl-8">
                      <button onClick={(e) => { e.stopPropagation(); onSelectAll(allIds); }} className="hover:scale-110 transition-transform">
                         {isAllSelected ? (
                           <CheckSquare size={18} className={color === 'blue' ? "text-blue-600" : "text-orange-600"} />
                         ) : (
                           <Square size={18} className="text-slate-300" />
                         )}
                      </button>
                    </TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Section Identity</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Capacity Analytics</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 text-center">Male</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 text-center">Female</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 text-center">JHS</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 text-center">ALS</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500 text-right pr-8">Section Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sections.map((sec: any, idx: number) => {
                    const activeStudents = sec.students?.filter((s: any) => s.status === 'Accepted' || s.status === 'Approved') || []
                    const mCount = activeStudents.filter((s: any) => s.gender === 'Male').length
                    const fCount = activeStudents.filter((s: any) => s.gender === 'Female').length
                    const jhsCount = activeStudents.filter((s: any) => s.student_category?.toLowerCase().includes('jhs') || s.student_category === 'Standard').length
                    const alsCount = activeStudents.filter((s: any) => s.student_category?.toLowerCase().includes('als')).length
                    const capacity = sec.capacity || 40
                    const fillPercent = capacity > 0 ? Math.min((activeStudents.length / capacity) * 100, 100) : 0
                    const mP = capacity > 0 ? Math.min((mCount / capacity) * 100, 100) : 0
                    const fP = capacity > 0 ? Math.min((fCount / capacity) * 100, 100) : 0
                    const isSelected = selection.has(sec.id)
                    const isICT = sec.strand === 'ICT'
                    
                    // Balancing Line Logic (Dynamic Follow)
                    let linePosition = 50
                    if (capacity > 0) {
                      if (mCount > fCount) linePosition = mP
                      else if (fCount > mCount) linePosition = 100 - fP
                      else linePosition = 50
                    }

                    const isFull = fillPercent >= 100

                    return (
                      <TableRow 
                        key={sec.id}
                        onClick={() => onSelect(sec.section_name)}
                        className={`cursor-pointer transition-all duration-300 relative group overflow-hidden animate-in slide-in-from-right-4 fade-in fill-mode-backwards hover:shadow-xl hover:scale-[1.005] rounded-xl ${
                          isSelected 
                            ? (isICT ? (isDarkMode ? 'bg-gradient-to-r from-blue-900/40 to-slate-900' : 'bg-gradient-to-r from-blue-50 to-white') : (isDarkMode ? 'bg-gradient-to-r from-orange-900/40 to-slate-900' : 'bg-gradient-to-r from-orange-50 to-white'))
                            : (isDarkMode ? 'bg-gradient-to-r from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900' : 'bg-gradient-to-r from-white to-slate-50 hover:from-slate-50 hover:to-white')
                        }`}
                        style={{ animationDelay: `${idx * 50}ms`, boxShadow: isSelected ? undefined : (isDarkMode ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(148, 163, 184, 0.1)') }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                             e.currentTarget.style.backgroundColor = isICT 
                               ? (isDarkMode ? 'rgba(30, 58, 138, 0.4)' : 'rgba(239, 246, 255, 1)') 
                               : (isDarkMode ? 'rgba(124, 45, 18, 0.4)' : 'rgba(255, 247, 237, 1)')
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                             e.currentTarget.style.backgroundColor = ''
                          }
                        }}
                      >
                        <TableCell className="pl-8 py-4 relative">
                          <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 ${isSelected ? `opacity-100 ${isICT ? 'shadow-[0_0_15px_rgba(59,130,246,0.8)]' : 'shadow-[0_0_15px_rgba(249,115,22,0.8)]'}` : 'opacity-30 group-hover:opacity-100 shadow-none'} ${isICT ? 'bg-blue-500' : 'bg-orange-500'}`} />
                          <div className="flex items-center gap-3">
                            <button onClick={(e) => { e.stopPropagation(); onToggleSelect(sec.id); }}>
                               {isSelected ? (
                                 <CheckSquare size={18} className={isICT ? "text-blue-600" : "text-orange-600"} />
                               ) : (
                                 <Square size={18} className="text-slate-300" />
                               )}
                            </button>
                            {isICT ? <Cpu size={16} className="text-blue-500/50" /> : <BookOpen size={16} className="text-orange-500/50" />}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div>
                            <p className={`font-black uppercase text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{sec.section_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {isICT ? (
                                <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none text-[8px] font-black uppercase px-2 py-0.5 shadow-md shadow-blue-500/20">ICT Strand</Badge>
                              ) : (
                                <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-none text-[8px] font-black uppercase px-2 py-0.5 shadow-md shadow-orange-500/20">GAS Strand</Badge>
                              )}
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">S.Y. {config?.school_year || "UNSET"}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 w-[30%]">
                          <div className={`p-4 rounded-2xl border relative overflow-hidden group/progress transition-all duration-500 ${isFull ? 'shadow-[0_0_15px_rgba(59,130,246,0.15)] dark:shadow-[0_0_15px_rgba(59,130,246,0.3)]' : ''} ${isDarkMode ? 'bg-slate-950/30 border-slate-800' : 'bg-slate-50/80 border-slate-200'}`}>
                            {/* Blur/Glow Effect */}
                            <div className={`absolute inset-0 opacity-0 group-hover/progress:opacity-100 transition-opacity duration-500 ${isFull ? 'opacity-100 bg-blue-500/10' : (isICT ? 'bg-blue-500/5' : 'bg-orange-500/5')}`} />
                            
                            <div className="flex justify-between items-end mb-2 relative z-10">
                               <span className="text-[10px] font-black text-blue-500 uppercase">{Math.round(mP)}% Male</span>
                               <span className="text-[10px] font-black text-purple-500 uppercase">{Math.round(fillPercent)}% Total</span>
                               <span className="text-[10px] font-black text-pink-500 uppercase">{Math.round(fP)}% Female</span>
                            </div>

                            <div className={`relative h-3 w-full rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 shadow-inner ${isFull ? 'shadow-[0_0_10px_rgba(59,130,246,0.4)]' : ''}`}>
                                {/* Split Progress Bar (Meeting in Middle) */}
                                <div style={{ width: `${mP}%` }} className="absolute left-0 top-0 bottom-0 h-full bg-blue-500 transition-all duration-1000" />
                                <div style={{ width: `${fP}%` }} className="absolute right-0 top-0 bottom-0 h-full bg-pink-500 transition-all duration-1000" />
                                
                                {/* Balancing Line Indicator */}
                                <div className="absolute top-0 bottom-0 w-0.5 bg-white/80 z-20 transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,1)]" style={{ left: `${linePosition}%` }} />
                            </div>
                            
                            <div className="flex justify-between mt-2 relative z-10">
                               <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /><span className="text-[8px] font-bold text-slate-400 uppercase">{mCount} Male</span></div>
                               <div className="flex items-center gap-1"><span className="text-[8px] font-bold text-slate-400 uppercase">{fCount} Female</span><div className="w-1.5 h-1.5 rounded-full bg-pink-500" /></div>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-center">
                               <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                 {activeStudents.length} / {capacity} Students
                               </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                           <div className={`inline-flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-transform group-hover:scale-110 ${isDarkMode ? 'bg-slate-800 group-hover:bg-slate-700' : 'bg-slate-50 group-hover:bg-white group-hover:shadow-md'}`}>
                              <span className="text-[10px] font-black text-blue-500">M</span>
                              <span className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{mCount}</span>
                           </div>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                           <div className={`inline-flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-transform group-hover:scale-110 ${isDarkMode ? 'bg-slate-800 group-hover:bg-slate-700' : 'bg-slate-50 group-hover:bg-white group-hover:shadow-md'}`}>
                              <span className="text-[10px] font-black text-pink-500">F</span>
                              <span className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{fCount}</span>
                           </div>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                           <div className={`inline-flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-transform group-hover:scale-110 ${isDarkMode ? 'bg-slate-800 group-hover:bg-slate-700' : 'bg-slate-50 group-hover:bg-white group-hover:shadow-md'}`}>
                              <span className="text-[8px] font-black text-purple-500 uppercase">JHS</span>
                              <span className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{jhsCount}</span>
                           </div>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                           <div className={`inline-flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-transform group-hover:scale-110 ${isDarkMode ? 'bg-slate-800 group-hover:bg-slate-700' : 'bg-slate-50 group-hover:bg-white group-hover:shadow-md'}`}>
                              <span className="text-[8px] font-black text-orange-500 uppercase">ALS</span>
                              <span className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{alsCount}</span>
                           </div>
                        </TableCell>
                        <TableCell className="py-4 pr-8 text-right">
                           <Badge className={`${fillPercent >= 100 ? 'bg-green-500 shadow-green-500/30' : 'bg-red-500 shadow-red-500/30'} text-white border-none font-black text-[9px] uppercase px-3 py-1 shadow-lg`}>
                             {fillPercent >= 100 ? 'FULL' : 'AVAILABLE'}
                           </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </section>
  )
})
