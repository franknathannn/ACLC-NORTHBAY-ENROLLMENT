// src/app/admin/applicants/components/ApplicantsTable.tsx
import { memo, useRef, useState, useEffect } from "react"
import { CheckSquare, Square, Eye, RotateCcw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ThemedCard } from "@/components/ThemedCard"
import { ThemedText } from "@/components/ThemedText"
import { themeColors } from "@/lib/themeColors"

interface ApplicantsTableProps {
  isDarkMode: boolean
  filteredStudents: any[]
  selectedIds: string[]
  toggleSelect: (id: string) => void
  toggleSelectAll: () => void
  hiddenRows: Set<string>
  exitingRows: Record<string, boolean>
  animatingIds: Set<string>
  setOpenStudentDialog: (id: string) => void
  handleExit: (id: string, callback: () => void) => void
  handleStatusChange: (id: string, name: string, status: string) => void
  setActiveDeclineStudent: (student: any) => void
  setDeclineModalOpen: (open: boolean) => void
  setActiveDeleteStudent: (student: any) => void
  setDeleteModalOpen: (open: boolean) => void
  strandStats?: Record<string, boolean>
}

interface ApplicantRowProps {
  student: any
  isSelected: boolean
  isHidden: boolean
  isExiting: boolean
  isAnimatingIn: boolean
  isStrandFull: boolean
  isDarkMode: boolean
  toggleSelect: (id: string) => void
  setOpenStudentDialog: (id: string) => void
  handleExit: (id: string, callback: () => void) => void
  handleStatusChange: (id: string, name: string, status: string) => void
  setActiveDeclineStudent: (student: any) => void
  setDeclineModalOpen: (open: boolean) => void
  setActiveDeleteStudent: (student: any) => void
  setDeleteModalOpen: (open: boolean) => void
}

const MobileApplicantRow = memo(({ 
  student, isSelected, isHidden, isExiting, isAnimatingIn, isStrandFull, isDarkMode,
  toggleSelect, setOpenStudentDialog, handleExit, handleStatusChange, 
  setActiveDeclineStudent, setDeclineModalOpen, setActiveDeleteStudent, setDeleteModalOpen 
}: ApplicantRowProps) => {
  if (isHidden) return null
  const isMale = student.gender !== 'Female'
  
  return (
    <div 
      className={`rounded-3xl p-5 border relative transition-all ${
        isSelected 
          ? (isMale ? 'bg-blue-50/90 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800' : 'bg-pink-50/90 border-pink-200 dark:bg-pink-900/30 dark:border-pink-800')
          : (isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-100')
      } ${isExiting ? 'animate-[slideOutRight_0.3s_ease-in-out_forwards]' : ''} ${isAnimatingIn ? 'animate-[slideInRight_0.5s_ease-out_backwards]' : ''}`}
      onClick={() => setOpenStudentDialog(student.id)}
      style={{
        animationFillMode: isExiting ? 'forwards' : isAnimatingIn ? 'backwards' : 'none'
      }}
    >
      <div className="flex items-start gap-4">
        <button onClick={(e) => { e.stopPropagation(); toggleSelect(student.id); }} className="mt-1">
          {isSelected ? <CheckSquare className="text-blue-600" size={20} /> : <Square className="text-slate-300" size={20} />}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className={`w-12 h-12 rounded-2xl overflow-hidden ${isMale ? 'bg-blue-100' : 'bg-pink-100'}`}>
                  <img 
                    src={student.two_by_two_url || student.profile_2x2_url || student.profile_picture || "https://api.dicebear.com/7.x/initials/svg?seed=" + student.last_name} 
                    alt="Avatar" 
                    className="w-full h-full object-cover" 
                    loading="lazy"
                  />
                </div>
                <div className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md text-[6px] font-black uppercase tracking-widest text-white shadow-sm z-10 ${
                  student.student_category?.toLowerCase().includes('als') 
                    ? 'bg-orange-500' 
                    : 'bg-blue-500'
                }`}>
                  {student.student_category?.toLowerCase().includes('als') ? 'ALS' : 'JHS'}
                </div>
              </div>
              <div>
                <h3 className={`font-black text-sm uppercase leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {student.last_name}, {student.first_name}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 tracking-wider">LRN: {student.lrn}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className={`px-2 py-1.5 rounded-xl text-center border ${isMale ? 'bg-blue-50/50 border-blue-100 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' : 'bg-pink-50/50 border-pink-100 text-pink-600 dark:bg-pink-900/20 dark:border-pink-800 dark:text-pink-400'}`}>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-70">Gender</p>
              <p className="text-[10px] font-black uppercase mt-0.5">{student.gender}</p>
            </div>
            <div className={`px-2 py-1.5 rounded-xl text-center border ${student.strand === 'ICT' ? 'bg-indigo-50/50 border-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400' : 'bg-orange-50/50 border-orange-100 text-orange-600 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400'}`}>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-70">Strand</p>
              <p className="text-[10px] font-black uppercase mt-0.5">{student.strand}</p>
            </div>
            <div className={`px-2 py-1.5 rounded-xl text-center border ${isDarkMode ? 'bg-slate-700/30 border-slate-600 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-70">Section</p>
              <p className="text-[10px] font-black uppercase mt-0.5 truncate">{student.section || 'Unassigned'}</p>
            </div>
            <div className={`px-2 py-1.5 rounded-xl text-center border ${isDarkMode ? 'bg-slate-700/30 border-slate-600 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-70">GWA</p>
              <p className="text-[10px] font-black uppercase mt-0.5">{student.gwa_grade_10 || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`mt-4 pt-3 border-t flex items-center justify-between gap-2 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
        <Button onClick={(e) => { e.stopPropagation(); setOpenStudentDialog(student.id); }} variant="ghost" size="sm" className="flex-1 h-9 rounded-xl text-slate-500 font-black text-[9px] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800"><Eye size={14} className="mr-1.5"/> View</Button>

        {student.status === 'Pending' && (
          <>
            <Button onClick={(e) => { e.stopPropagation(); handleExit(student.id, () => handleStatusChange(student.id, `${student.first_name} ${student.last_name}`, 'Accepted')); }} variant="ghost" size="sm" disabled={isStrandFull} className={`flex-1 h-9 rounded-xl font-black text-[9px] uppercase tracking-widest ${isStrandFull ? 'text-slate-300 cursor-not-allowed' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`}>{isStrandFull ? 'FULL' : 'Approve'}</Button>
            <Button onClick={(e) => { e.stopPropagation(); setActiveDeclineStudent(student); setDeclineModalOpen(true); }} variant="ghost" size="sm" className="flex-1 h-9 rounded-xl text-red-600 font-black text-[9px] uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/20">Decline</Button>
          </>
        )}

        {(student.status === 'Accepted' || student.status === 'Approved' || student.status === 'Rejected') && (
          <Button onClick={(e) => { e.stopPropagation(); handleExit(student.id, () => handleStatusChange(student.id, `${student.first_name} ${student.last_name}`, 'Pending')); }} variant="ghost" size="sm" className="flex-1 h-9 rounded-xl text-amber-600 font-black text-[9px] uppercase tracking-widest hover:bg-amber-50 dark:hover:bg-amber-900/20"><RotateCcw size={12} className="mr-1.5"/> Reset</Button>
        )}

        {(student.status === 'Pending' || student.status === 'Rejected') && (
          <Button onClick={(e) => { e.stopPropagation(); setActiveDeleteStudent(student); setDeleteModalOpen(true); }} variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={14}/></Button>
        )}
      </div>
    </div>
  )
})
MobileApplicantRow.displayName = "MobileApplicantRow"

const DesktopApplicantRow = memo(({ 
  student, isSelected, isHidden, isExiting, isAnimatingIn, isStrandFull, isDarkMode,
  toggleSelect, setOpenStudentDialog, handleExit, handleStatusChange, 
  setActiveDeclineStudent, setDeclineModalOpen, setActiveDeleteStudent, setDeleteModalOpen 
}: ApplicantRowProps) => {
  if (isHidden) return null
  const isMale = student.gender !== 'Female'
  const baseBg = isSelected ? (isMale ? 'bg-blue-100/80 dark:bg-blue-900/40' : 'bg-pink-100/80 dark:bg-pink-900/40') : ''
  const genderHoverBg = isMale 
    ? (isSelected ? 'hover:!bg-blue-300 dark:hover:!bg-blue-800' : 'hover:!bg-blue-200 dark:hover:!bg-blue-900/40') 
    : (isSelected ? 'hover:!bg-pink-300 dark:hover:!bg-pink-800' : 'hover:!bg-pink-200 dark:hover:!bg-pink-900/40')

  return (
    <TableRow 
      className={`transition-colors border-b group relative ${baseBg} ${genderHoverBg} hover:shadow-sm will-change-transform ${isExiting ? 'animate-[slideOutRight_0.3s_ease-in-out_forwards] pointer-events-none' : ''} ${isAnimatingIn ? 'animate-[slideInRight_0.5s_ease-out_backwards]' : ''}`}
      onMouseEnter={(e) => {
        if (isSelected) {
          e.currentTarget.style.backgroundColor = isMale ? 'rgb(219 234 254 / 0.8)' : 'rgb(252 231 243 / 0.8)'
        } else {
          e.currentTarget.style.backgroundColor = isMale ? 'rgb(191 219 254 / 0.6)' : 'rgb(251 207 232 / 0.6)'
        }
        e.currentTarget.style.transition = 'background-color 0.2s ease'
      }}
      onMouseLeave={(e) => {
        if (isSelected) {
          e.currentTarget.style.backgroundColor = isMale ? 'rgb(219 234 254 / 0.8)' : 'rgb(252 231 243 / 0.8)'
        } else {
          e.currentTarget.style.backgroundColor = ''
        }
      }}
      style={{
        borderColor: isDarkMode ? 'rgba(77, 87, 100, 0.4)' : 'rgba(231, 229, 229, 0.53)',
        ...(isSelected ? { backgroundColor: isMale ? 'rgb(219 234 254 / 0.8)' : 'rgb(252 231 243 / 0.8)' } : undefined),
        animationFillMode: isExiting ? 'forwards' : isAnimatingIn ? 'backwards' : 'none'
      }}
    >
      <TableCell className="pl-4 md:pl-8">
        <button onClick={() => toggleSelect(student.id)}>
          {isSelected ? <CheckSquare className="text-blue-600" size={18} /> : <Square className="text-slate-200" size={18} />}
        </button>
      </TableCell>
      <TableCell className="px-3 md:px-6 py-5 relative">
        <div 
          onClick={() => setOpenStudentDialog(student.id)} 
          className="flex items-center gap-3 md:gap-4 cursor-pointer hover:opacity-90 transition-opacity group/name"
        >
          <div className="relative">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden border border-white shadow-lg shrink-0 ring-2 transition-all group-hover/name:scale-105 ${
              isMale 
                ? 'ring-blue-400/60 group-hover/name:ring-blue-500' 
                : 'ring-pink-400/40 group-hover/name:ring-pink-500'
            }`}>
              <img 
                src={student.two_by_two_url || student.profile_2x2_url || student.profile_picture || "https://api.dicebear.com/7.x/initials/svg?seed=" + student.last_name} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
                loading="lazy"
              />
            </div>
            <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[6px] md:text-[7px] font-black uppercase tracking-widest text-white shadow-sm z-10 whitespace-nowrap ${
              student.student_category?.toLowerCase().includes('als') 
                ? 'bg-gradient-to-r from-orange-500 to-red-500 shadow-orange-500/30' 
                : 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-blue-500/30'
            }`}>
              {student.student_category?.toLowerCase().includes('als') ? 'ALS' : 'JHS'}
            </div>
          </div>
          <div className="min-w-0">
            <ThemedText variant="h3" className="text-sm md:text-base leading-none group-hover/name:text-blue-600 dark:group-hover/name:text-blue-400 transition-colors" isDarkMode={isDarkMode} style={{ color: isDarkMode ? '#ffffff' : 'black' }}>{student.first_name} {student.last_name}</ThemedText>
            <ThemedText variant="label" className="mt-1 text-slate-500 dark:text-slate-400" isDarkMode={isDarkMode}>LRN: {student.lrn}</ThemedText>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-center font-black text-[10px] uppercase text-slate-500">
        <span className={student.gender === 'Female' ? 'text-pink-500' : 'text-blue-500'}>{student.gender}</span>
      </TableCell>
      <TableCell className="text-center">
        <Badge className={`border-none px-2 md:px-3 py-1 text-[9px] font-black uppercase ${student.strand === 'ICT' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
          {student.strand}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <span className={`text-[10px] font-black uppercase ${student.section && student.section !== 'Unassigned' ? (isDarkMode ? 'text-white' : 'text-slate-900') : 'text-slate-400 italic'}`}>
          {student.section || 'Unassigned'}
        </span>
      </TableCell>
      <TableCell className="text-center"><ThemedText variant="body" className="font-black" isDarkMode={isDarkMode} style={{ color: isDarkMode ? undefined : 'black' }}>{student.gwa_grade_10 || 'N/A'}</ThemedText></TableCell>
      <TableCell className="text-right px-4 md:px-8">
        <div className="flex items-center justify-end gap-1.5 md:gap-2 flex-nowrap">
          <Button 
            onClick={() => setOpenStudentDialog(student.id)} 
            variant="ghost"
            className="h-9 px-3 rounded-xl text-slate-500 font-black text-[9px] uppercase tracking-widest transition-colors shrink-0 flex items-center justify-center"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgb(71 85 105)'
              e.currentTarget.style.color = 'white'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = ''
              e.currentTarget.style.color = 'rgb(100 116 139)'
            }}
          >
            <Eye size={16}/>
          </Button>

          {student.status === 'Pending' && (
            <>
              <Button onClick={() => handleExit(student.id, () => handleStatusChange(student.id, `${student.first_name} ${student.last_name}`, 'Accepted'))} variant="ghost" disabled={isStrandFull} className={`h-9 px-2 md:px-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-colors shrink-0 whitespace-nowrap ${isStrandFull ? 'text-slate-300 cursor-not-allowed' : 'text-green-600'}`} onMouseEnter={(e) => { if (!isStrandFull) { e.currentTarget.style.backgroundColor = 'rgb(22 163 74)'; e.currentTarget.style.color = 'white'; } }} onMouseLeave={(e) => { if (!isStrandFull) { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'rgb(22 163 74)'; } }}><span className="hidden sm:inline">{isStrandFull ? 'FULL' : 'Approve'}</span><span className="sm:hidden">{isStrandFull ? 'X' : '✓'}</span></Button>
              <Button 
                onClick={() => {
                  setActiveDeclineStudent(student);
                  setDeclineModalOpen(true);
                }} 
                variant="ghost" 
                className="h-9 px-2 md:px-3 rounded-xl text-red-600 font-black text-[9px] uppercase tracking-widest transition-colors shrink-0 whitespace-nowrap"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgb(220 38 38)'
                  e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = ''
                  e.currentTarget.style.color = 'rgb(220 38 38)'
                }}
              >
                <span className="hidden sm:inline">Decline</span><span className="sm:hidden">✗</span>
              </Button>
            </>
          )}

          {(student.status === 'Accepted' || student.status === 'Approved') && (
            <>
              <Button 
                onClick={() => handleExit(student.id, () => handleStatusChange(student.id, `${student.first_name} ${student.last_name}`, 'Pending'))} 
                variant="ghost" 
                className="h-9 px-2 md:px-3 rounded-xl text-amber-600 font-black text-[9px] uppercase tracking-widest transition-colors shrink-0 whitespace-nowrap"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgb(245 158 11)'
                  e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = ''
                  e.currentTarget.style.color = 'rgb(217 119 6)'
                }}
              >
                <RotateCcw size={12} className="mr-1"/> <span className="hidden sm:inline">Reset</span>
              </Button>
            </>
          )}

          {student.status === 'Rejected' && (
            <Button 
              onClick={() => handleExit(student.id, () => handleStatusChange(student.id, `${student.first_name} ${student.last_name}`, 'Pending'))} 
              variant="ghost" 
              className="h-9 px-3 md:px-4 rounded-xl text-amber-600 font-black text-[9px] uppercase tracking-widest transition-colors shrink-0 whitespace-nowrap"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgb(245 158 11)'
                e.currentTarget.style.color = 'white'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = ''
                e.currentTarget.style.color = 'rgb(217 119 6)'
              }}
            >
              <RotateCcw size={14} className="mr-1 md:mr-2"/> <span className="hidden sm:inline">Reset</span>
            </Button>
          )}

          {(student.status === 'Pending' || student.status === 'Rejected') && (
            <Button 
              onClick={() => {
                setActiveDeleteStudent(student);
                setDeleteModalOpen(true);
              }}
              variant="ghost" 
              className="h-9 px-3 rounded-xl text-red-600 dark:text-red-400 font-black text-[9px] uppercase tracking-widest transition-colors shrink-0 flex items-center justify-center"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgb(220 38 38)'
                e.currentTarget.style.color = 'white'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = ''
                e.currentTarget.style.color = ''
              }}
            >
              <Trash2 size={16}/>
            </Button>
          )}

        </div>
      </TableCell>
    </TableRow>
  )
})
DesktopApplicantRow.displayName = "DesktopApplicantRow"

const useVirtualizer = (itemCount: number, itemHeight: number, containerRef: React.RefObject<HTMLDivElement | null>) => {
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(600)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const update = () => {
      setScrollTop(element.scrollTop)
      setViewportHeight(element.clientHeight || 600)
    }

    update()

    const handleScroll = () => requestAnimationFrame(update)
    const handleResize = () => requestAnimationFrame(update)

    element.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleResize)

    return () => {
      element.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [containerRef])

  const overscan = 3
  const visibleCount = Math.ceil(viewportHeight / itemHeight)
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(itemCount - 1, startIndex + visibleCount + (overscan * 2))

  const virtualItems = []
  for (let i = startIndex; i <= endIndex; i++) {
    virtualItems.push(i)
  }

  const paddingTop = startIndex * itemHeight
  const paddingBottom = Math.max(0, (itemCount - 1 - endIndex) * itemHeight)

  return { virtualItems, paddingTop, paddingBottom }
}

export const ApplicantsTable = memo(({
  isDarkMode, filteredStudents, selectedIds, toggleSelect, toggleSelectAll, hiddenRows, exitingRows, animatingIds,
  setOpenStudentDialog, handleExit, handleStatusChange, setActiveDeclineStudent, setDeclineModalOpen, setActiveDeleteStudent, setDeleteModalOpen, strandStats
}: ApplicantsTableProps) => {
  const mobileContainerRef = useRef<HTMLDivElement>(null)
  const desktopContainerRef = useRef<HTMLDivElement>(null)
  
  const MOBILE_ROW_HEIGHT = 280
  const DESKTOP_ROW_HEIGHT = 89

  const { virtualItems: mobileItems, paddingTop: mobilePT, paddingBottom: mobilePB } = 
    useVirtualizer(filteredStudents.length, MOBILE_ROW_HEIGHT, mobileContainerRef)

  const { virtualItems: desktopItems, paddingTop: desktopPT, paddingBottom: desktopPB } = 
    useVirtualizer(filteredStudents.length, DESKTOP_ROW_HEIGHT, desktopContainerRef)

  return (
    <>
      <style jsx global>{`
        @keyframes slideOutRight {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(40px);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
      
      <ThemedCard 
        className="rounded-[32px] md:rounded-[48px] shadow-2xl shadow-slate-200/50 dark:shadow-blue-500/10 overflow-hidden transition-colors duration-500 border"
        style={{    
          backgroundColor: isDarkMode ? themeColors.dark.surface : '#ffffff',
          borderColor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : '#f1f5f9'
        }}
      >
        {/* MOBILE CARD VIEW */}
        <div ref={mobileContainerRef} className="md:hidden p-4 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between px-2 pb-2">
            <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
              {selectedIds.length === filteredStudents.length && filteredStudents.length > 0 
                ? <CheckSquare className="text-blue-600" size={16} /> 
                : <Square className={isDarkMode ? "text-slate-500" : "text-slate-400"} size={16} />
              }
              <span>Select All</span>
            </button>
            <span className="text-[10px] font-bold text-slate-400">{filteredStudents.length} Records</span>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="py-20 text-center text-slate-400 italic">No applicants match this criteria.</div>
          ) : (
            <>
              <div style={{ height: mobilePT }} />
              {mobileItems.map((index) => {
                const student = filteredStudents[index]
            return (
              <MobileApplicantRow 
                key={student.id}
                student={student}
                isSelected={selectedIds.includes(student.id)}
                isHidden={hiddenRows.has(student.id)}
                isExiting={exitingRows[student.id]}
                isAnimatingIn={animatingIds.has(student.id)}
                isStrandFull={strandStats?.[student.strand] || false}
                isDarkMode={isDarkMode}
                toggleSelect={toggleSelect}
                setOpenStudentDialog={setOpenStudentDialog}
                handleExit={handleExit}
                handleStatusChange={handleStatusChange}
                setActiveDeclineStudent={setActiveDeclineStudent}
                setDeclineModalOpen={setDeclineModalOpen}
                setActiveDeleteStudent={setActiveDeleteStudent}
                setDeleteModalOpen={setDeleteModalOpen}
              />
            )
              })}
              <div style={{ height: mobilePB }} />
            </>
          )}
        </div>

        {/* DESKTOP TABLE VIEW */}
        <div ref={desktopContainerRef} className="hidden md:block max-h-[70vh] overflow-y-auto custom-scrollbar relative">
          <Table className="min-w-full table-fixed">
            <TableHeader className={`sticky top-0 z-20 ${isDarkMode ? 'bg-slate-900' : 'bg-white'} shadow-sm`}>
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-12 min-w-[48px] max-w-[48px] pl-4 md:pl-8" style={{ color: 'grey' }}>
                  <button onClick={toggleSelectAll}>
                    {selectedIds.length === filteredStudents.length && filteredStudents.length > 0 
                      ? <CheckSquare className="text-blue-600" size={18} /> 
                      : <Square className={isDarkMode ? "text-slate-500" : "text-slate-400"} size={18} />
                    }
                  </button>
                </TableHead>
                <TableHead className={`w-[280px] min-w-[280px] px-3 md:px-6 py-6 font-black uppercase text-[10px] tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} style={{ color: 'grey' }}>Applicant Identity</TableHead>
                <TableHead className={`w-[100px] min-w-[100px] font-black uppercase text-[10px] tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} text-center`} style={{ color: 'grey' }}>Gender</TableHead>
                <TableHead className={`w-[120px] min-w-[120px] font-black uppercase text-[10px] tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} text-center`} style={{ color: 'grey' }}>Strand</TableHead>
                <TableHead className={`w-[140px] min-w-[140px] font-black uppercase text-[10px] tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} text-center`} style={{ color: 'grey' }}>Section</TableHead>
                <TableHead className={`w-[80px] min-w-[80px] font-black uppercase text-[10px] tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} text-center`} style={{ color: 'grey' }}>GWA</TableHead>
                <TableHead className={`w-[280px] min-w-[280px] text-right px-4 md:px-8 font-black uppercase text-[10px] tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} style={{ color: 'grey' }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="py-32 text-center text-slate-400 italic">No applicants match this criteria.</TableCell></TableRow>
              ) : (
                <>
                  {desktopPT > 0 && <tr style={{ height: desktopPT }} />}
                  {desktopItems.map((index) => {
                    const student = filteredStudents[index]
                return (
                  <DesktopApplicantRow 
                    key={student.id}
                    student={student}
                    isSelected={selectedIds.includes(student.id)}
                    isHidden={hiddenRows.has(student.id)}
                    isExiting={exitingRows[student.id]}
                    isAnimatingIn={animatingIds.has(student.id)}
                    isStrandFull={strandStats?.[student.strand] || false}
                    isDarkMode={isDarkMode}
                    toggleSelect={toggleSelect}
                    setOpenStudentDialog={setOpenStudentDialog}
                    handleExit={handleExit}
                    handleStatusChange={handleStatusChange}
                    setActiveDeclineStudent={setActiveDeclineStudent}
                    setDeclineModalOpen={setDeclineModalOpen}
                    setActiveDeleteStudent={setActiveDeleteStudent}
                    setDeleteModalOpen={setDeleteModalOpen}
                  />
                )
                  })}
                  {desktopPB > 0 && <tr style={{ height: desktopPB }} />}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </ThemedCard>
    </>
  )
})
ApplicantsTable.displayName = "ApplicantsTable"