// c:\Users\Nath\Documents\Enrollment System\enrollment-system\src\app\admin\sections\components\StudentTable.tsx

import { memo } from "react"
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Undo2, Eye, UserX, Fingerprint, Shield, Copy, User, MoreVertical, Star, Activity } from "lucide-react"
import { SwitchDialog } from "./SwitchDialog"
import { toast } from "sonner"

export const StudentTable = memo(function StudentTable({ 
  students, 
  onReturn, 
  onUnenroll, 
  onSwitch, 
  allSections, 
  onOpenFile, 
  onViewProfile, 
  isDarkMode, 
  exitingRows, 
  hiddenRows, 
  handleExit, 
  animatingIds 
}: any) {

  const handleCopyLRN = (e: React.MouseEvent, lrn: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(lrn);
    toast.success(`LRN ${lrn} copied`, {
      style: { fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }
    });
  };

  // 🧪 PROP-BASED THEME ENGINE (Syncs with React State, ignores Layout hardcoding)
  const theme = {
    cardBg: isDarkMode ? 'bg-slate-900/60' : 'bg-white',
    textMain: isDarkMode ? 'text-white' : 'text-slate-900',
    textSub: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    border: isDarkMode ? 'border-white/10' : 'border-slate-200',
    innerBg: isDarkMode ? 'bg-black/40' : 'bg-slate-50',
    dockBg: isDarkMode ? 'bg-slate-950/80' : 'bg-slate-100/80',
    shadow: isDarkMode ? 'shadow-[0_15px_30px_-10px_rgba(0,0,0,0.6)]' : 'shadow-lg shadow-slate-200/50'
  };

  return (
    <>
      {/* 📱 MOBILE MODULE VIEW (Aegis Command Stylized) */}
      <div className="md:hidden space-y-6 px-3 pb-10">
        {students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400 opacity-30">
            <Fingerprint size={64} strokeWidth={1} className="mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Node_Void: No_Records</p>
          </div>
        ) : (
          students.map((s: any) => {
            if (hiddenRows.has(s.id)) return null
            const isAnimatingIn = animatingIds?.has(s.id)
            const isMale = s.gender === 'Male'
            
            return (
              <div 
                key={s.id}
                onClick={() => onViewProfile(s)}
                className={`
                  rounded-[32px] overflow-hidden border transition-all duration-500 transform-gpu relative isolate bg-clip-padding outline outline-1 outline-transparent
                  ${theme.cardBg} ${theme.border} ${theme.shadow}
                  ${exitingRows[s.id] ? 'animate-out slide-out-to-right fade-out duration-300' : ''} 
                  ${isAnimatingIn ? 'animate-in fade-in zoom-in-95 slide-in-from-right-10 duration-700' : ''}
                `}
              >
                {/* 🌈 Lively Bio-Header */}
                <div className="p-5 flex items-center gap-5 relative">
                    {/* Gender Logic Accent Bar */}
                    <div className={`absolute left-0 top-6 bottom-6 w-1.5 rounded-r-full shadow-[0_0_15px_rgba(var(--accent),0.5)] ${isMale ? 'bg-blue-500' : 'bg-pink-500'}`} />
                    
                    {/* Animated Profile Well */}
                    <div className="relative shrink-0">
                        <div className={`absolute inset-0 blur-xl opacity-20 ${isMale ? 'bg-blue-500' : 'bg-pink-500'}`} />
                        <div className={`w-16 h-16 rounded-2xl p-1 border-2 relative z-10 ${isMale ? 'border-blue-500/30' : 'border-pink-500/30'}`}>
                            <img 
                                src={s.two_by_two_url || s.profile_2x2_url || s.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${s.last_name}`} 
                                className="w-full h-full object-cover rounded-xl" 
                                alt="Student" 
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-black text-lg uppercase leading-none tracking-tighter truncate ${theme.textMain}`}>
                        {s.last_name}, {s.first_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                         <Badge className={`text-[8px] font-black uppercase px-2 py-0 border-none rounded-md ${isMale ? 'bg-blue-500/20 text-blue-500' : 'bg-pink-500/20 text-pink-500'}`}>
                            {s.gender}
                         </Badge>
                         <div className="flex items-center gap-1.5 opacity-60">
                            <span className={`text-[9px] font-mono font-bold tracking-widest ${theme.textSub}`}>LRN:{s.lrn}</span>
                            <button 
                               onClick={(e) => handleCopyLRN(e, s.lrn)}
                               className={`p-1 rounded-md transition-all active:scale-90 ${theme.innerBg}`}
                            >
                               <Copy size={10} className={theme.textSub} />
                            </button>
                         </div>
                      </div>
                    </div>
                </div>

                {/* 📊 Hardware Data Grid */}
                <div className="px-5 pb-5 grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-2xl border flex flex-col items-center gap-1 ${theme.innerBg} ${theme.border}`}>
                      <Activity size={12} className="text-slate-500 opacity-40" />
                      <p className="text-[7px] font-black uppercase text-slate-500 tracking-[0.2em]">Matrix Mode</p>
                      <p className={`text-[10px] font-black uppercase ${theme.textMain}`}>{s.student_category || "Standard"}</p>
                    </div>
                    <div className={`p-3 rounded-2xl border flex flex-col items-center gap-1 ${theme.innerBg} ${theme.border}`}>
                      <Star size={12} className="text-blue-500 opacity-50" />
                      <p className="text-[7px] font-black uppercase text-slate-500 tracking-[0.2em]">GWA Index</p>
                      <p className={`text-[12px] font-black italic text-blue-500`}>{s.gwa_grade_10 || "0.00"}</p>
                    </div>
                </div>

                {/* 🎮 Crystalline Action Dock */}
                <div className={`p-2 flex items-center gap-2 border-t ${theme.dockBg} ${theme.border}`}>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={(e) => {e.stopPropagation(); handleExit(s.id, () => onReturn(s.id, s.first_name))}} 
                      className="flex-1 h-12 rounded-2xl text-[9px] font-black uppercase tracking-widest text-orange-500 hover:bg-orange-500 hover:text-white transition-all transform-gpu active:scale-95"
                    >
                      <Undo2 size={14} className="mr-2"/> Return
                    </Button>

                    <div onClick={(e) => e.stopPropagation()} className="flex-1">
                      <SwitchDialog 
                        student={s} 
                        allSections={allSections} 
                        onSwitch={(id: string, target: string) => handleExit(id, () => onSwitch(id, target))} 
                        isDarkMode={isDarkMode} 
                        className="w-full h-12 text-[9px] rounded-2xl bg-transparent border-0 hover:bg-blue-600 hover:text-white text-blue-500 font-black uppercase tracking-widest" 
                      />
                    </div>

                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={(e) => {e.stopPropagation(); onUnenroll(s)}} 
                      className="h-12 w-12 p-0 rounded-2xl text-red-500 hover:bg-red-500 hover:text-white transition-all transform-gpu active:scale-95"
                    >
                      <UserX size={18} />
                    </Button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 🖥️ DESKTOP VIEW (RETAINED AS REQUESTED) */}
      <div 
        className="hidden md:block rounded-[40px] border overflow-hidden shadow-2xl transition-all duration-700 isolate bg-clip-padding outline outline-1 outline-transparent" 
        style={{ 
          backgroundColor: isDarkMode ? 'rgb(2 6 23)' : '#ffffff', 
          borderColor: isDarkMode ? 'rgb(30 41 59)' : 'rgb(241 245 249)' 
        }}
      >
        <Table className="border-separate border-spacing-0">
        <TableHeader 
          className="transition-colors duration-500" 
          style={{ backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgb(248 250 252)' }}
        >
           <TableRow className="border-none hover:bg-transparent">
              <TableHead className="px-10 py-8 font-black uppercase text-[10px] tracking-[0.3em] text-slate-500">
                Registry Subject Identity
              </TableHead>
              <TableHead className="px-6 py-8 font-black uppercase text-[10px] tracking-[0.3em] text-center text-slate-500">
                Gender
              </TableHead>
              <TableHead className="px-6 py-8 font-black uppercase text-[10px] tracking-[0.3em] text-center text-slate-500">
                Status
              </TableHead>
              <TableHead className="text-right px-10 py-8 font-black uppercase text-[10px] tracking-[0.3em] text-slate-500">
                Matrix Control
              </TableHead>
           </TableRow>
        </TableHeader>
        <TableBody>
          {students.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-40">
                <div className="flex flex-col items-center opacity-20">
                   <Fingerprint size={64} strokeWidth={1} className="mb-4 text-slate-400" />
                   <p className="font-black uppercase tracking-[0.5em] text-xs">No Records in Current Node</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            students.map((s: any) => {
              if (hiddenRows.has(s.id)) return null
              const isAnimatingIn = animatingIds?.has(s.id)
              const isMale = s.gender === 'Male'
              
              return (
                <TableRow 
                  key={s.id} 
                  className={`group transition-all duration-300 border-b hover:z-10 relative will-change-transform border-slate-100 dark:border-slate-800 ${
                    exitingRows[s.id] ? 'animate-out slide-out-to-right-8 fade-out zoom-out-95 duration-300 pointer-events-none' : ''
                  } ${isAnimatingIn ? 'animate-in slide-in-from-right fade-in duration-500' : ''}`}
                  style={exitingRows[s.id] ? { animationFillMode: 'forwards' } : undefined}
                  onMouseEnter={(e) => {
                    if (isMale) {
                      e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)'
                    } else {
                      e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(236, 72, 153, 0.15)' : 'rgba(236, 72, 153, 0.08)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = ''
                  }}
                >
                  <TableCell className="px-10 py-5 relative cursor-pointer overflow-hidden" onClick={() => onViewProfile(s)}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-500 group-hover:w-2 ${
                      isMale 
                        ? 'bg-blue-400/30 group-hover:bg-blue-500 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.6)]' 
                        : 'bg-pink-400/30 group-hover:bg-pink-500 group-hover:shadow-[0_0_20px_rgba(236,72,153,0.6)]'
                    }`} />
                    
                    <div className="flex items-center gap-6 transition-transform duration-500 group-hover:translate-x-3">
                      <div className={`w-14 h-14 rounded-2xl p-1 border-2 transition-all duration-500 shrink-0 ${
                        isMale 
                          ? 'border-blue-300/40 group-hover:border-blue-500 group-hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] group-hover:bg-blue-100/30' 
                          : 'border-pink-300/40 group-hover:border-pink-500 group-hover:shadow-[0_0_25px_rgba(236,72,153,0.6)] group-hover:bg-pink-100/30'
                      }`}>
                         <img 
                            src={s.two_by_two_url || s.profile_2x2_url || s.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${s.last_name}`} 
                            alt="2x2" 
                            className="w-full h-full object-cover rounded-xl" 
                         />
                      </div>
                      <div>
                        <div className={`font-black text-lg uppercase leading-none tracking-tight transition-colors duration-500 ${isDarkMode ? 'text-white group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-600'}`}>
                          {s.last_name}, {s.first_name} <span className="text-[10px] opacity-40 font-black italic">{s.middle_name?.[0]}.</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                           <Shield size={10} className="text-slate-400" />
                           <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">LRN:{s.lrn}</p>
                           <button 
                             onClick={(e) => handleCopyLRN(e, s.lrn)}
                             className={`p-1 rounded-md transition-all active:scale-90 shadow-sm ${
                               isDarkMode 
                               ? 'bg-slate-800 text-slate-400 hover:text-white' 
                               : 'bg-slate-100 text-slate-500 hover:text-slate-900'
                             }`}
                           >
                              <Copy size={10} />
                           </button>
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                     <Badge variant="outline" className={`font-black text-[9px] uppercase px-4 py-1 rounded-full border shadow-sm transition-all duration-500 ${
                       s.gender === 'Female' ? 'bg-pink-500/10 text-pink-500 border-pink-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                     }`}>
                       {s.gender}
                     </Badge>
                  </TableCell>

                  <TableCell className="text-center">
                     <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border transition-colors ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${s.student_category?.includes('ALS') ? 'bg-orange-500' : 'bg-green-500'}`} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                          {s.student_category || "Regular"}
                        </span>
                     </div>
                  </TableCell>

                  <TableCell className="text-right px-10">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {e.stopPropagation(); handleExit(s.id, () => onReturn(s.id, s.first_name))}}
                        className="h-9 px-4 rounded-xl text-orange-500 font-black text-[9px] uppercase tracking-[0.2em] transition-all inline-flex items-center justify-center bg-transparent border-0"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgb(249 115 22)'
                          e.currentTarget.style.color = 'white'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.color = 'rgb(249 115 22)'
                        }}
                      >
                        <Undo2 size={12} className="mr-2"/> Return
                      </button>

                      <div onClick={(e) => e.stopPropagation()}>
                        <SwitchDialog 
                          student={s} 
                          allSections={allSections} 
                          onSwitch={(id: string, target: string) => handleExit(id, () => onSwitch(id, target))} 
                          isDarkMode={isDarkMode}
                        />
                      </div>

                      <button
                        onClick={(e) => {e.stopPropagation(); onViewProfile(s)}}
                        className="h-9 w-9 p-0 rounded-xl transition-all inline-flex items-center justify-center text-slate-400 bg-transparent border-0"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? 'white' : 'rgb(15 23 42)'
                          e.currentTarget.style.color = isDarkMode ? 'rgb(15 23 42)' : 'white'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.color = 'rgb(148 163 184)'
                        }}
                      >
                        <Eye size={16}/>
                      </button>

                      <button
                        onClick={(e) => {e.stopPropagation(); onUnenroll(s)}}
                        className="h-9 w-9 p-0 rounded-xl text-red-400 transition-all inline-flex items-center justify-center bg-transparent border-0"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgb(239 68 68)'
                          e.currentTarget.style.color = 'white'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.color = 'rgb(248 113 113)'
                        }}
                      >
                        <UserX size={16}/>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
      </div>
    </>
  )
})