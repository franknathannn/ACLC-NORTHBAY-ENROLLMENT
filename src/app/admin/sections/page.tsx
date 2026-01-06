"use client"

import { useEffect, useState, useMemo, useCallback, memo, useRef, useLayoutEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { addSection, deleteAndCollapseSection } from "@/lib/actions/sections"
import { updateApplicantStatus, deleteApplicant, updateStudentSection } from "@/lib/actions/applicants"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Plus, Loader2, Cpu, BookOpen, Layers, Trash
} from "lucide-react"
import { toast } from "sonner"
import { ThemedCard } from "@/components/ThemedCard"
import { ThemedText } from "@/components/ThemedText"
import { useTheme } from "@/hooks/useTheme"
import { themeColors } from "@/lib/themeColors"
import { FilterButton } from "./components/FilterButton";
import { SectionGroup } from "./components/SectionGroup"
import { DeleteManagementDialog } from "./components/DeleteManagementDialog"
import { ProcessingOverlay } from "./components/ProcessingOverlay"
import { RealtimeStatusIndicator } from "./components/RealtimeStatusIndicator"
import { DocumentViewerDialog } from "./components/DocumentViewerDialog"
import { UnenrollDialog } from "./components/UnenrollDialog"
import { AddSectionDialog } from "./components/AddSectionDialog"
import { BulkDeleteDialog } from "./components/BulkDeleteDialog"
import { ProfileDialog } from "./components/ProfileDialog"
import { SectionDetailView } from "./components/SectionDetailView"

// ===== MAIN COMPONENT =====
export default function SectionsPage() {
  const [config, setConfig] = useState<any>(null)
  const { isDarkMode: themeDarkMode } = useTheme()
  const [isDarkMode, setIsDarkMode] = useState(themeDarkMode)
  const [sections, setSections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedSectionName, setSelectedSectionName] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [strandFilter, setStrandFilter] = useState<"ALL" | "ICT" | "GAS">("ALL")
  
  const [sectionSelection, setSectionSelection] = useState<Set<string>>(new Set())
  const [confirmAdd, setConfirmAdd] = useState<{isOpen: boolean, strand: "ICT" | "GAS" | null}>({isOpen: false, strand: null})
  const [confirmDeleteSelect, setConfirmDeleteSelect] = useState(false)

  const [ictExpanded, setIctExpanded] = useState(true)
  const [gasExpanded, setGasExpanded] = useState(true)

  // ===== PERSISTENCE LOGIC (CONFIRMED LOCATION) =====
  useEffect(() => {
    // Restore Expanded State
    const savedIct = localStorage.getItem("section_ict_expanded")
    const savedGas = localStorage.getItem("section_gas_expanded")
    if (savedIct !== null) setIctExpanded(savedIct === "true")
    if (savedGas !== null) setGasExpanded(savedGas === "true")

    // Restore Scroll Position
    const savedScroll = sessionStorage.getItem("sections_scroll_pos")
    if (savedScroll) {
      setTimeout(() => window.scrollTo({ top: parseInt(savedScroll), behavior: 'instant' }), 100)
    }

    const handleScroll = () => {
      sessionStorage.setItem("sections_scroll_pos", window.scrollY.toString())
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => { localStorage.setItem("section_ict_expanded", ictExpanded.toString()) }, [ictExpanded])
  useEffect(() => { localStorage.setItem("section_gas_expanded", gasExpanded.toString()) }, [gasExpanded])

  // PERSISTENCE FOR FILTER TAB - Locked Selection selection between page moves
  useEffect(() => {
    const savedFilter = localStorage.getItem("sections_strand_filter")
    if (savedFilter) setStrandFilter(savedFilter as any)
  }, [])

  useEffect(() => {
    localStorage.setItem("sections_strand_filter", strandFilter)
  }, [strandFilter])

  const [exitingRows, setExitingRows] = useState<Record<string, boolean>>({})
  const [hiddenRows, setHiddenRows] = useState<Set<string>>(new Set())
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set())
  const prevStudentIdsRef = useRef<Set<string>>(new Set())
  const prevStudentsMapRef = useRef<Map<string, any>>(new Map())
  const [ghostStudents, setGhostStudents] = useState<any[]>([])
  const prevSectionRef = useRef<string | null>(null)

  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewingFile, setViewingFile] = useState<{url: string, label: string} | null>(null)
  const [rotation, setRotation] = useState(0)

  const [unenrollOpen, setUnenrollOpen] = useState(false)
  const [activeUnenrollStudent, setActiveUnenrollStudent] = useState<any>(null)

  const [profileOpen, setProfileOpen] = useState(false)
  const [activeProfile, setActiveProfile] = useState<any>(null)
  const [realtimeStatus, setRealtimeStatus] = useState<string>('Initializing...')
  const [lastUpdate, setLastUpdate] = useState<string>('')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    const saved = localStorage.getItem("registrar_active_matrix")
    if (saved) setSelectedSectionName(saved)
  }, [])

  useEffect(() => {
    if (selectedSectionName) localStorage.setItem("registrar_active_matrix", selectedSectionName)
    else localStorage.removeItem("registrar_active_matrix")
  }, [selectedSectionName])

  useEffect(() => {
    setHiddenRows(new Set())
    setExitingRows({})
    setGhostStudents([])
  }, [selectedSectionName])

  useEffect(() => {
    setExitingRows({})
  }, [sections])
  

  const handleExit = useCallback((id: string, callback: () => void) => {
    setExitingRows(prev => ({ ...prev, [id]: true }))
    setTimeout(() => {
      setHiddenRows(prev => { const next = new Set(prev); next.add(id); return next })
      callback()
    }, 300)
  }, [])

  const handleOpenFile = useCallback((url: string, label: string) => {
    setViewingFile({ url, label })
    setRotation(0)
    setViewerOpen(true)
  }, [])

  const handleViewProfile = useCallback((student: any) => {
    setActiveProfile(student)
    setProfileOpen(true)
  }, [])

  const handleUnenroll = useCallback((student: any) => {
    setActiveUnenrollStudent(student)
    setUnenrollOpen(true)
  }, [])

  useEffect(() => {
    setIsDarkMode(themeDarkMode)
  }, [themeDarkMode])

  useEffect(() => {
    const handleThemeChange = (e: any) => {
      setIsDarkMode(e.detail.mode === 'dark')
    }
    window.addEventListener('theme-change', handleThemeChange)
    return () => window.removeEventListener('theme-change', handleThemeChange)
  }, [])

  const fetchConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('system_config').select('*').single()
      if (error) throw error
      setConfig(data)
    } catch (err) {
      console.error("Config fetch error:", err)
    }
  }, [])

  const fetchSections = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true)
    console.log(`🔄 Fetching sections... (background: ${isBackground})`)
    
    try {
      const { data, error } = await supabase
        .from('sections')
        .select(`*, students ( * )`)
        .order('section_name', { ascending: true })
  
      if (error) throw error
      
      setSections(data || [])
    } catch (err) {
      console.error("❌ Sync Error:", err)
      if (!isBackground) toast.error("Registrar Sync Error")
    } finally {
      if (!isBackground) setLoading(false)
    }
  }, [])

  useEffect(() => { 
    fetchSections() 
    fetchConfig()
    
    const channel = supabase
      .channel('sections_realtime_complete')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'students' 
      }, (payload) => {
        setRealtimeStatus(`🔄 ${payload.eventType}`)
        setLastUpdate(new Date().toLocaleTimeString())
        fetchSections(true)
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'sections' 
      }, (payload) => {
        setRealtimeStatus(`📋 Section ${payload.eventType}`)
        setLastUpdate(new Date().toLocaleTimeString())
        fetchSections(true)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('🟢 Live')
          setLastUpdate(new Date().toLocaleTimeString())
        } else if (status === 'CHANNEL_ERROR') {
          setRealtimeStatus('🔴 Error')
          setTimeout(() => fetchSections(true), 2000)
        } else if (status === 'TIMED_OUT') {
          setRealtimeStatus('⏱️ Timeout')
          setTimeout(() => fetchSections(true), 2000)
        } else {
          setRealtimeStatus(`⚠️ ${status}`)
        }
      })

    return () => { supabase.removeChannel(channel) }
  }, [fetchConfig, fetchSections])

  const ictSections = useMemo(() => sections.filter(s => s.strand === 'ICT'), [sections])
  const gasSections = useMemo(() => sections.filter(s => s.strand === 'GAS'), [sections])

  const calculateStrandLoad = useCallback((strandSections: any[]) => {
    const totalCapacity = strandSections.reduce((acc, s) => acc + (s.capacity || 40), 0)
    const totalEnrolled = strandSections.reduce((acc, s) => {
      const active = s.students?.filter((st: any) => st.status === 'Accepted' || st.status === 'Approved').length || 0
      return acc + active
    }, 0)
    return { totalCapacity, totalEnrolled, percent: totalCapacity > 0 ? (totalEnrolled / totalCapacity) * 100 : 0 }
  }, [])

  const ictLoad = useMemo(() => calculateStrandLoad(ictSections), [ictSections, calculateStrandLoad])
  const gasLoad = useMemo(() => calculateStrandLoad(gasSections), [gasSections, calculateStrandLoad])

  const currentSection = useMemo(() => {
    return sections.find(s => s.section_name === selectedSectionName)
  }, [sections, selectedSectionName])
  
  const activeStudents = useMemo(() => {
    if (!currentSection?.students) return []
    return currentSection.students.filter((s: any) => s.status === 'Accepted' || s.status === 'Approved')
  }, [currentSection?.students, selectedSectionName])

  // ===== ENTRANCE ANIMATION TRIGGER (Matrix Registry Reveal) =====
  useLayoutEffect(() => {
    if (!selectedSectionName) {
      prevStudentIdsRef.current = new Set()
      prevSectionRef.current = null
      prevStudentsMapRef.current = new Map()
      setGhostStudents([])
      return
    }
  
    if (selectedSectionName !== prevSectionRef.current) {
      prevSectionRef.current = selectedSectionName
      prevStudentIdsRef.current = new Set(activeStudents.map((s: any) => s.id))
      prevStudentsMapRef.current = new Map(activeStudents.map((s: any) => [s.id, s]))
      setGhostStudents([])
      return
    }
  
    const currentIds = new Set(activeStudents.map((s: any) => s.id))
    const newIds = activeStudents
      .filter((s: any) => !prevStudentIdsRef.current.has(s.id))
      .map((s: any) => s.id)
  
    if (newIds.length > 0) {
      setHiddenRows(prev => {
        const next = new Set(prev)
        newIds.forEach((id: string) => next.delete(id))
        return next
      })
      setExitingRows(prev => {
        const next = { ...prev }
        newIds.forEach((id: string) => delete next[id])
        return next
      })
      setAnimatingIds(prev => {
        const next = new Set(prev)
        newIds.forEach((id: string) => next.add(id))
        return next
      })
      setTimeout(() => {
        setAnimatingIds(prev => {
          const next = new Set(prev)
          newIds.forEach((id: string) => next.delete(id))
          return next
        })
      }, 500)
    }
    
    const removedStudents: any[] = []
    prevStudentsMapRef.current.forEach((s, id) => {
      if (!currentIds.has(id)) removedStudents.push(s)
    })
  
    if (removedStudents.length > 0) {
      setGhostStudents(prev => [...prev, ...removedStudents])
      setExitingRows(prev => {
        const next = { ...prev }
        removedStudents.forEach((s: any) => { next[s.id] = true })
        return next
      })
      setTimeout(() => {
        setGhostStudents(prev => prev.filter(g => !removedStudents.find(r => r.id === g.id)))
        setExitingRows(prev => {
          const next = { ...prev }
          removedStudents.forEach((s: any) => { delete next[s.id] })
          return next
        })
      }, 300)
    }
    
    prevStudentIdsRef.current = new Set(activeStudents.map((s: any) => s.id))
    prevStudentsMapRef.current = new Map(activeStudents.map((s: any) => [s.id, s]))
  }, [activeStudents, selectedSectionName])

  const initiateAdd = useCallback((strand: "ICT" | "GAS") => {
    setConfirmAdd({ isOpen: true, strand })
  }, [])

  const executeAdd = useCallback(async () => {
    if (!confirmAdd.strand) return
    setIsProcessing(true)
    try {
      const result = await addSection(confirmAdd.strand)
      toast.success(`Generated ${result.name}`)
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('activity_logs').insert([{
        admin_id: user?.id,
        admin_name: user?.user_metadata?.username || 'Admin',
        action_type: 'APPROVED',
        student_name: 'N/A',
        details: `Created new ${confirmAdd.strand} section: ${result.name}`
      }])
      setConfirmAdd({ isOpen: false, strand: null })
      await fetchSections()
    } catch (err: any) { 
      toast.error(err.message) 
    } finally { 
      setIsProcessing(false) 
    }
  }, [confirmAdd.strand, fetchSections])

  const toggleSelection = useCallback((id: string) => {
    setSectionSelection(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSelectAll = useCallback((ids: string[]) => {
    setSectionSelection(prev => {
      const next = new Set(prev)
      const allSelected = ids.every(id => prev.has(id))
      if (allSelected) ids.forEach(id => next.delete(id))
      else ids.forEach(id => next.add(id))
      return next
    })
  }, [])

  const executeBulkDelete = useCallback(async () => {
    setConfirmDeleteSelect(false)
    setIsProcessing(true)
    try {
      const targets = sections.filter(s => sectionSelection.has(s.id))
      for (const t of targets) await deleteAndCollapseSection(t.id, t.strand)
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('activity_logs').insert([{
        admin_id: user?.id,
        admin_name: user?.user_metadata?.username || 'Admin',
        action_type: 'DELETED',
        student_name: 'N/A',
        details: `Bulk deleted ${targets.length} section matrices`
      }])
      toast.success(`Removed ${targets.length} matrices.`)
      setSectionSelection(new Set())
      await fetchSections()
    } catch (e) { 
      toast.error("Bulk delete failed") 
    } finally { 
      setIsProcessing(false) 
    }
  }, [sectionSelection, sections, fetchSections])

  const handleDeleteSection = useCallback(async (id: string, name: string, strand: "ICT" | "GAS") => {
    if (!confirm(`WARNING: Deleting ${name} shifts matrix sequence. Proceed?`)) return
    setIsProcessing(true)
    try {
      await deleteAndCollapseSection(id, strand)
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('activity_logs').insert([{
        admin_id: user?.id,
        admin_name: user?.user_metadata?.username || 'Admin',
        action_type: 'DELETED',
        student_name: 'N/A',
        details: `Deleted section matrix: ${name} (${strand})`
      }])
      toast.success(`Matrix Sequence Updated.`)
      await fetchSections()
    } catch (err: any) { 
      toast.error(err.message) 
    } finally { 
      setIsProcessing(false) 
    }
  }, [fetchSections])

  const handleClearAllStudents = useCallback(async () => {
    const confirmName = prompt("Type 'DELETE ALL' to PERMANENTLY wipe the student database.")
    if (confirmName !== "DELETE ALL") return
    setIsProcessing(true)
    try {
      await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('activity_logs').insert([{
        admin_id: user?.id,
        admin_name: user?.user_metadata?.username || 'Admin',
        action_type: 'DELETED',
        student_name: 'ALL STUDENTS',
        details: "Executed complete registry wipe (Factory Reset)"
      }])
      toast.success("Student database purged.")
      await fetchSections()
    } catch (err: any) { 
      toast.error(err.message) 
    } finally { 
      setIsProcessing(false) 
    }
  }, [fetchSections])

  const handleReturnToPending = useCallback(async (id: string, name: string) => {
    try {
      await updateApplicantStatus(id, 'Pending')
      const { data: { user } } = await supabase.auth.getUser()
      const student = sections.flatMap(s => s.students).find((s: any) => s.id === id)
      await supabase.from('activity_logs').insert([{
        admin_id: user?.id,
        admin_name: user?.user_metadata?.username || 'Admin',
        action_type: 'PENDING',
        student_name: name,
        student_id: id,
        student_image: student?.two_by_two_url || student?.profile_2x2_url,
        details: "Student Returned to Pending"
      }])
      toast.success(`${name} returned to Pending queue.`)
      fetchSections()
    } catch (err) { 
      toast.error("Action failed") 
    }
  }, [sections, fetchSections])

  const handleConfirmUnenroll = useCallback(async () => {
    if (!activeUnenrollStudent) return
    setUnenrollOpen(false)
    handleExit(activeUnenrollStudent.id, async () => {
      const toastId = toast.loading(`Purging ${activeUnenrollStudent.first_name}...`)
      try {
        const result = await deleteApplicant(activeUnenrollStudent.id)
        if (result.success) {
          const { data: { user } } = await supabase.auth.getUser()
          await supabase.from('activity_logs').insert([{
            admin_id: user?.id,
            admin_name: user?.user_metadata?.username || 'Admin',
            action_type: 'DELETED',
            student_name: `${activeUnenrollStudent.first_name} ${activeUnenrollStudent.last_name}`,
            student_id: null,
            student_image: activeUnenrollStudent.two_by_two_url || activeUnenrollStudent.profile_2x2_url,
            details: "Deleted from the list"
          }])
          toast.success(`Record Erased Successfully`, { id: toastId })
          setActiveUnenrollStudent(null)
          fetchSections()
        }
      } catch (err) { 
        toast.error("Database purge failed") 
      }
    })
  }, [activeUnenrollStudent, fetchSections, handleExit])

  const handleSwitch = useCallback(async (id: string, newSectionName: string) => {
    try {
      const targetSec = sections.find(s => s.section_name === newSectionName)
      if (!targetSec) return
      await updateStudentSection(id, targetSec.id)
      const { data: { user } } = await supabase.auth.getUser()
      const student = sections.flatMap(s => s.students).find((s: any) => s.id === id)
      await supabase.from('activity_logs').insert([{
        admin_id: user?.id,
        admin_name: user?.user_metadata?.username || 'Admin',
        action_type: 'SWITCHED',
        student_name: student ? `${student.first_name} ${student.last_name}` : 'Unknown Student',
        student_id: id,
        student_image: student?.two_by_two_url || student?.profile_2x2_url,
        details: `Transferred to matrix ${newSectionName}`
      }])
      toast.success(`Moved to ${newSectionName}`)
      fetchSections()
    } catch (err) { 
      toast.error("Transfer failed") 
    }
  }, [sections, fetchSections])

  const exportSectionCSV = useCallback((sectionName: string, students: any[]) => {
    const headers = ["FULL NAME", "LRN", "GENDER", "STRAND", "EMAIL", "ADDRESS"]
    const rows = students.map(s => [
      `${s.last_name.toUpperCase()}, ${s.first_name.toUpperCase()} ${s.middle_name?.[0] || ''}.`,
      `'${s.lrn}`,
      s.gender,
      s.strand,
      s.email,
      `"${s.address}"`
    ])
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `Masterlist_${sectionName}.csv`
    link.click()
  }, [])

  if (loading && sections.length === 0) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 text-slate-400">
      <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
      <p className="text-[10px] font-black uppercase tracking-widest text-center">Syncing Class Matrices...</p>
    </div>
  )

  return (
    <div className="relative min-h-screen [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] transition-colors duration-500 overflow-x-hidden max-w-[100vw]">
      <style jsx global>{`
        body { overflow-y: auto; }
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <RealtimeStatusIndicator status={realtimeStatus} lastUpdate={lastUpdate} />
      
      <div className="space-y-6 md:space-y-12 animate-in fade-in duration-700 pb-20 relative z-10 w-full overflow-x-hidden">
      
      {selectedSectionName ? (() => {
        const activeIds = new Set(activeStudents.map((s: any) => s.id))
        const uniqueGhosts = ghostStudents.filter(g => !activeIds.has(g.id))
        const sortedStudents = [...activeStudents, ...uniqueGhosts].sort((a, b) => a.last_name.localeCompare(b.last_name))
        const mCount = activeStudents.filter((s: any) => s.gender === 'Male').length
        const fCount = activeStudents.filter((s: any) => s.gender === 'Female').length
        const capacity = currentSection?.capacity || 40
        const fillPercent = (activeStudents.length / capacity) * 100

        return (
          <SectionDetailView
            sectionName={selectedSectionName}
            currentSection={currentSection}
            activeStudents={activeStudents}
            capacity={capacity}
            fillPercent={fillPercent}
            config={config}
            isDarkMode={isDarkMode}
            onBack={() => setSelectedSectionName(null)}
            onRefresh={() => fetchSections(false)}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onExport={exportSectionCSV}
            sortedStudents={sortedStudents}
            mCount={mCount}
            fCount={fCount}
            debouncedSearch={debouncedSearch}
            sections={sections}
            handleReturnToPending={handleReturnToPending}
            handleUnenroll={handleUnenroll}
            handleSwitch={handleSwitch}
            handleOpenFile={handleOpenFile}
            handleViewProfile={handleViewProfile}
            exitingRows={exitingRows}
            hiddenRows={hiddenRows}
            handleExit={handleExit}
            animatingIds={animatingIds}
          />
        )
      })() : (
        <>
          {/* HEADER CARD - FIXED: Shielding logic applied to prevent phantom lines */}
          <ThemedCard 
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 p-6 md:p-10 rounded-[48px] backdrop-blur-sm shadow-lg border transition-all duration-500 bg-clip-padding outline outline-1 outline-transparent isolate"
            style={{
              backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.8)',
              borderColor: isDarkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(203, 213, 225, 0.5)'
            }}
          >
            <div className="space-y-3 transform-gpu">
              <ThemedText variant="h1" className="text-4xl md:text-5xl font-black tracking-tight" isDarkMode={isDarkMode}>
                School Units
              </ThemedText>
              <ThemedText variant="body" className="text-base font-medium opacity-70" isDarkMode={isDarkMode}>
                Managing AMA ACLC Northbay Enrollment Distribution
              </ThemedText>
            </div>

            {/* PERSISTENT FILTER DOCK - Hardware stabilized */}
            <div 
              className="flex p-2 rounded-[24px] border shadow-inner transition-all duration-300 bg-clip-padding isolate transform-gpu"
              style={{ 
                backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.8)',
                borderColor: isDarkMode ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'
              }}
            >
               <FilterButton 
                 label="All" 
                 active={strandFilter === 'ALL'} 
                 onClick={() => setStrandFilter('ALL')} 
                 icon={<Layers size={16}/>} 
                 type="ALL" 
                 isDarkMode={isDarkMode} 
               />
               <FilterButton 
                 label="ICT" 
                 active={strandFilter === 'ICT'} 
                 onClick={() => setStrandFilter('ICT')} 
                 icon={<Cpu size={16}/>} 
                 type="ICT" 
                 isDarkMode={isDarkMode} 
               />
               <FilterButton 
                 label="GAS" 
                 active={strandFilter === 'GAS'} 
                 onClick={() => setStrandFilter('GAS')} 
                 icon={<BookOpen size={16}/>} 
                 type="GAS" 
                 isDarkMode={isDarkMode} 
               />
            </div>
            
            <div className="flex flex-wrap gap-4">
              {sectionSelection.size > 0 && (
                 <Button 
                   onClick={() => setConfirmDeleteSelect(true)} 
                   variant="destructive" 
                   className="rounded-2xl h-12 px-6 font-bold uppercase text-xs tracking-wider shadow-lg transition-all animate-in fade-in zoom-in"
                 >
                    <Trash className="mr-2" size={18}/> Delete ({sectionSelection.size})
                 </Button>
              )}
              <DeleteManagementDialog 
                sections={sections} 
                onDelete={handleDeleteSection} 
                onClearStudents={handleClearAllStudents} 
                isDarkMode={isDarkMode} 
              />
              <Button 
                onClick={() => initiateAdd('ICT')} 
                disabled={isProcessing} 
                className="rounded-2xl bg-blue-600 hover:bg-blue-700 h-12 px-6 font-bold uppercase text-xs tracking-wider shadow-lg shadow-blue-500/20 transition-all active:scale-95"
              >
                <Plus className="mr-2" size={18}/> Add ICT Section
              </Button>
              <Button 
                onClick={() => initiateAdd('GAS')} 
                disabled={isProcessing} 
                className="rounded-2xl bg-orange-600 hover:bg-orange-700 h-12 px-6 font-bold uppercase text-xs tracking-wider shadow-lg shadow-orange-500/20 transition-all active:scale-95"
              >
                <Plus className="mr-2" size={18}/> Add GAS Section
              </Button>
            </div>
          </ThemedCard>
          
          {['ICT', 'GAS'].map(strand => (strandFilter === 'ALL' || strandFilter === strand) && (
            <SectionGroup 
              key={strand} 
              title={strand === 'ICT' ? "Information Technology" : "General Academics"}
              mobileTitle={strand === 'ICT' ? "ICT Program" : "GAS Program"}
              icon={strand === 'ICT' ? <Cpu/> : <BookOpen/>} 
              color={strand === 'ICT' ? 'blue' : 'orange'} 
              sections={strand === 'ICT' ? ictSections : gasSections} 
              load={strand === 'ICT' ? ictLoad : gasLoad} 
              onSelect={setSelectedSectionName} 
              onDelete={handleDeleteSection} 
              isExpanded={strand === 'ICT' ? ictExpanded : gasExpanded} 
              onToggle={strand === 'ICT' ? () => setIctExpanded(!ictExpanded) : () => setGasExpanded(!gasExpanded)}
              selection={sectionSelection}
              onToggleSelect={toggleSelection}
              onSelectAll={handleSelectAll}
              isDarkMode={isDarkMode}
              config={config}
            />
          ))}
        </>
      )}

      {/* DIALOGS (RETAINED) */}
      <DocumentViewerDialog 
        open={viewerOpen} 
        onOpenChange={setViewerOpen} 
        file={viewingFile} 
        rotation={rotation} 
        setRotation={setRotation} 
      />
      <UnenrollDialog 
        open={unenrollOpen} 
        onOpenChange={setUnenrollOpen} 
        student={activeUnenrollStudent} 
        onConfirm={handleConfirmUnenroll} 
        isDarkMode={isDarkMode} 
      />
      <ProfileDialog 
        open={profileOpen} 
        onOpenChange={setProfileOpen} 
        student={activeProfile} 
        onOpenFile={handleOpenFile} 
        isDarkMode={isDarkMode} 
      />
      <AddSectionDialog 
        open={confirmAdd.isOpen} 
        onOpenChange={(open: boolean) => !open && setConfirmAdd({ ...confirmAdd, isOpen: false })} 
        strand={confirmAdd.strand} 
        onConfirm={executeAdd} 
        isProcessing={isProcessing} 
        isDarkMode={isDarkMode} 
      />
      <BulkDeleteDialog 
        open={confirmDeleteSelect} 
        onOpenChange={setConfirmDeleteSelect} 
        count={sectionSelection.size} 
        onConfirm={executeBulkDelete} 
        isDarkMode={isDarkMode} 
      />
      {isProcessing && <ProcessingOverlay />}
    </div>
    </div>
  )
}