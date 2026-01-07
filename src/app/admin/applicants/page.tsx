"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { supabase } from "@/lib/supabase/client"
import { 
 Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog"
import { Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { updateApplicantStatus, deleteApplicant, bulkUpdateApplicantStatus, bulkDeleteApplicants } from "@/lib/actions/applicants"
import { useTheme } from "@/hooks/useTheme"
import { StarConstellation } from "./components/StarConstellation"
import { StudentDossier } from "./components/StudentDossier"
import { ApplicantsHeader } from "./components/ApplicantsHeader"
import { ApplicantsFilter } from "./components/ApplicantsFilter"
import { ApplicantsTable } from "./components/ApplicantsTable"
import { BulkActionsFloatingBar } from "./components/BulkActionsFloatingBar"
import { ApplicantModals } from "./components/ApplicantModals"
import { DocumentViewerModal } from "./components/DocumentViewerModal"

export default function ApplicantsPage() {
 const { isDarkMode: themeDarkMode } = useTheme()
 const [isDarkMode, setIsDarkMode] = useState(themeDarkMode)
 const [viewerOpen, setViewerOpen] = useState(false)
 const [viewingFile, setViewingFile] = useState<{url: string, label: string} | null>(null)
 const [rotation, setRotation] = useState(0)
 const [students, setStudents] = useState<any[]>([])
 const [config, setConfig] = useState<any>(null)
 const [loading, setLoading] = useState(true)
 const [searchTerm, setSearchTerm] = useState("")
 const [filter, setFilter] = useState<"Pending" | "Accepted" | "Rejected">("Pending")
 const [selectedIds, setSelectedIds] = useState<string[]>([])
 const [sortBy, setSortBy] = useState<string>("alpha")
 const [sortDropdownOpen, setSortDropdownOpen] = useState(false)

 const [exitingRows, setExitingRows] = useState<Record<string, boolean>>({})
 const [hiddenRows, setHiddenRows] = useState<Set<string>>(new Set())

 const [strandStats, setStrandStats] = useState<Record<string, boolean>>({ ICT: false, GAS: false })
 const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
 const processingIdsRef = useRef<Set<string>>(new Set())

 // 🔥 NUCLEAR FIX: Per-tab snapshots to track witnessed arrivals
 const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set())
 const tabSnapshotsRef = useRef<Map<string, Set<string>>>(new Map())
 const prevFilterRef = useRef(filter)
 const isInitialMountRef = useRef(true)
 const activeTabRef = useRef(filter)

 useEffect(() => {
   processingIdsRef.current = processingIds
 }, [processingIds])

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

 const filteredStudents = useMemo(() => {
  const filtered = students.filter(s => {
   const matchesStatus = s.status === filter || (filter === 'Accepted' && s.status === 'Approved');
   const matchesSearch = `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) || s.lrn.includes(searchTerm);
   return matchesStatus && matchesSearch;
  })

  return filtered.sort((a, b) => {
    switch (sortBy) {
      case 'date_old': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'date_new': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'age': return (a.age || 0) - (b.age || 0);
      case 'gender': return a.gender.localeCompare(b.gender);
      case 'strand_ict': return a.strand === b.strand ? a.last_name.localeCompare(b.last_name) : (a.strand === 'ICT' ? -1 : 1);
      case 'strand_gas': return a.strand === b.strand ? a.last_name.localeCompare(b.last_name) : (a.strand === 'GAS' ? -1 : 1);
      case 'gwa_desc': return (parseFloat(b.gwa_grade_10) || 0) - (parseFloat(a.gwa_grade_10) || 0);
      case 'gwa_asc': return (parseFloat(a.gwa_grade_10) || 0) - (parseFloat(b.gwa_grade_10) || 0);
      case 'alpha_first': return a.first_name.localeCompare(b.first_name);
      case 'alpha': default: return a.last_name.localeCompare(b.last_name);
    }
  })
 }, [students, filter, searchTerm, sortBy])

 // 🎯 WITNESSED ARRIVALS: Only animate students who arrive while actively viewing the tab
 useEffect(() => {
   // Skip initial mount
   if (isInitialMountRef.current) {
     isInitialMountRef.current = false
     // Initialize snapshot for current tab
     const initialIds = new Set(filteredStudents.map(s => s.id))
     tabSnapshotsRef.current.set(filter, initialIds)
     activeTabRef.current = filter
     return
   }

   // 🔥 USER SWITCHED TABS (Manual navigation)
   if (filter !== prevFilterRef.current) {
     console.log('🔄 Tab Switch:', prevFilterRef.current, '→', filter)
     
     // Save snapshot of OLD tab before leaving
     const oldTabStudents = students.filter(s => {
       const matchesStatus = s.status === prevFilterRef.current || 
                            (prevFilterRef.current === 'Accepted' && s.status === 'Approved')
       const matchesSearch = `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.lrn.includes(searchTerm)
       return matchesStatus && matchesSearch
     })
     const oldTabIds = new Set(oldTabStudents.map(s => s.id))
     tabSnapshotsRef.current.set(prevFilterRef.current, oldTabIds)
     
     // Clear hidden/exiting rows when switching (keep processing ones)
     const currentProcessing = processingIdsRef.current
     setHiddenRows(prev => {
       const next = new Set<string>()
       prev.forEach(id => { if (currentProcessing.has(id)) next.add(id) })
       return next
     })
     setExitingRows(prev => {
       const next: Record<string, boolean> = {}
       Object.keys(prev).forEach(id => { if (currentProcessing.has(id)) next[id] = true })
       return next
     })
     
     // Update refs
     prevFilterRef.current = filter
     activeTabRef.current = filter
     
     // Initialize snapshot for NEW tab if not exists
     if (!tabSnapshotsRef.current.has(filter)) {
       const newTabIds = new Set(filteredStudents.map(s => s.id))
       tabSnapshotsRef.current.set(filter, newTabIds)
     }
     
     return // Don't animate on manual tab switch
   }

   // 🎯 DATA CHANGED WHILE ON CURRENT TAB (Witnessed arrivals)
   const snapshot = tabSnapshotsRef.current.get(filter) || new Set()
   const currentIds = new Set(filteredStudents.map(s => s.id))
   
   // Find NEW students who weren't in snapshot (witnessed arrivals)
   const newArrivals = filteredStudents
     .filter(s => !snapshot.has(s.id) && !processingIds.has(s.id))
     .map(s => s.id)

   if (newArrivals.length > 0) {
     console.log('🔥 WITNESSED ARRIVALS on', filter, ':', newArrivals)
     
     setAnimatingIds(prev => {
       const next = new Set(prev)
       newArrivals.forEach(id => next.add(id))
       return next
     })
     
     // Clear animation after duration
     const duration = newArrivals.length > 1 ? 600 : 500
     setTimeout(() => {
       setAnimatingIds(prev => {
         const next = new Set(prev)
         newArrivals.forEach(id => next.delete(id))
         return next
       })
     }, duration)
   }

   // 🎯 UPDATE SNAPSHOT with current visible students
   tabSnapshotsRef.current.set(filter, currentIds)

 }, [filteredStudents, filter, students, searchTerm, processingIds])

 // Re-show students if they reappear (cleanup after processing)
 useEffect(() => {
  setHiddenRows(prev => {
    if (prev.size === 0) return prev
    const next = new Set(prev)
    let changed = false
    filteredStudents.forEach(s => {
      if (next.has(s.id) && !processingIds.has(s.id)) {
        next.delete(s.id)
        changed = true
      }
    })
    return changed ? next : prev
  })

  setExitingRows(prev => {
    const next = { ...prev }
    let changed = false
    filteredStudents.forEach(s => {
      if (next[s.id] && !processingIds.has(s.id)) {
        delete next[s.id]
        changed = true
      }
    })
    return changed ? next : prev
  })
 }, [filteredStudents, processingIds])

 const handleExit = useCallback((id: string, callback: () => void) => {
  setExitingRows(prev => ({ ...prev, [id]: true }))
  setTimeout(() => {
    setHiddenRows(prev => { const next = new Set(prev); next.add(id); return next })
    callback()
  }, 300)
 }, [])

 // --- MODAL STATES ---
 const [declineModalOpen, setDeclineModalOpen] = useState(false)
 const [activeDeclineStudent, setActiveDeclineStudent] = useState<any>(null)
 const [declineReason, setDeclineReason] = useState("")
 const [bulkDeclineModalOpen, setBulkDeclineModalOpen] = useState(false)
 const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false)

 const [deleteModalOpen, setDeleteModalOpen] = useState(false)
 const [activeDeleteStudent, setActiveDeleteStudent] = useState<any>(null)
 const [openStudentDialog, setOpenStudentDialog] = useState<string | null>(null)

 const fetchStrandStats = useCallback(async () => {
  const { data: sections } = await supabase
    .from('sections')
    .select('strand, capacity, students(status)')

  if (sections) {
    const stats: Record<string, boolean> = {}
    const strands = ['ICT', 'GAS']
    
    strands.forEach(strand => {
      const strandSecs = sections.filter((s: any) => s.strand === strand)
      const totalCap = strandSecs.reduce((sum, s) => sum + (s.capacity || 0), 0)
      const totalEnrolled = strandSecs.reduce((sum, s) => 
        sum + s.students.filter((st: any) => st.status === 'Approved' || st.status === 'Accepted').length, 0)
      stats[strand] = totalEnrolled >= totalCap && totalCap > 0
    })
    
    setStrandStats(stats)
  }
 }, [])

 const fetchStudents = useCallback(async (isBackground = false) => {
  if (!isBackground) setLoading(true)
  try {
   const [studentsRes, configRes] = await Promise.all([
    supabase
      .from('students')
      .select('id, lrn, first_name, last_name, middle_name, gender, strand, contact_no, phone, email, gwa_grade_10, profile_picture, status, decline_reason, guardian_name, guardian_contact, section_id, school_year, form_138_url, good_moral_url, created_at, cor_url, af5_url, diploma_url, age, civil_status, last_school_attended, guardian_first_name, guardian_middle_name, guardian_last_name, student_category, two_by_two_url, guardian_phone, birth_date, religion, address, updated_at, registrar_feedback, section')
      .order('created_at', { ascending: false }),
    supabase.from('system_config').select('school_year').single()
   ])

   if (studentsRes.error) throw studentsRes.error
   
   setStudents(studentsRes.data || [])
   if (configRes.data) setConfig(configRes.data)
   
   fetchStrandStats()
  } catch (err) {
   console.error("⚡ Sync Error:", err)
   if (!isBackground) toast.error("Failed to load registrar database")
  } finally {
   if (!isBackground) setLoading(false)
  }
 }, [fetchStrandStats])

 useEffect(() => {
  fetchStudents()

  let debounceTimer: NodeJS.Timeout

  const channel = supabase
    .channel('admin_applicants_realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        fetchStrandStats()
        fetchStudents(true)
      }, 100)
    })
    .on('broadcast', { event: 'student_update' }, () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        fetchStrandStats()
        fetchStudents(true)
      }, 100)
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        fetchStudents(true)
      }
    })

  return () => {
    clearTimeout(debounceTimer)
    supabase.removeChannel(channel)
  }
 }, [fetchStudents, fetchStrandStats])

 const handleStatusChange = useCallback(async (studentId: string, name: string, status: any, feedback?: string) => {
  setProcessingIds(prev => { const next = new Set(prev); next.add(studentId); return next })
  const toastId = toast.loading(`⚡ Processing ${name}...`)
  
  try {
   setExitingRows(prev => ({ ...prev, [studentId]: true }))
   await new Promise(resolve => setTimeout(resolve, 280))
   
   setHiddenRows(prev => { const next = new Set(prev); next.add(studentId); return next })
   
   const result = await updateApplicantStatus(studentId, status, feedback);
   
   if (result.success) {
    const { data: { user } } = await supabase.auth.getUser();    
    const student = students.find(s => s.id === studentId);
    
    const assignedSectionId = result.assignedSectionId;
    const assignedSectionName = result.assignedSection || 'Unassigned';

    let description = `Manual status transition to ${status}`;
    if (status === 'Accepted') description = "Student Accepted";
    else if (status === 'Rejected') description = feedback ? `Student Rejected: ${feedback}` : "Student Rejected";
    else if (status === 'Pending') description = "Student Returned to Pending";

    await supabase.from('activity_logs').insert([{
      admin_id: user?.id,
      admin_name: user?.user_metadata?.username || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Authorized Admin',
      action_type: status.toUpperCase(),
      student_name: name,
      student_id: studentId,
      student_image: student?.two_by_two_url || student?.profile_2x2_url || student?.profile_picture,
      details: description
    }]);

    const successMsg = assignedSectionId 
      ? `✨ ${name} → ${assignedSectionName}` 
      : `✓ ${name} updated to ${status}`;
      
    toast.success(successMsg, { id: toastId })
    
    setStudents(prev => prev.map(s => s.id === studentId ? { 
        ...s, 
        status: status, 
        section_id: assignedSectionId, 
        section: assignedSectionName 
    } : s))
    
    setDeclineModalOpen(false)
    setDeclineReason("")
    setActiveDeclineStudent(null)
   }
  } catch (err: any) {
   toast.error(`❌ ${err.message}`, { id: toastId })
   setExitingRows(prev => { const next = { ...prev }; delete next[studentId]; return next })
   setHiddenRows(prev => { const next = new Set(prev); next.delete(studentId); return next })
  } finally {
   setProcessingIds(prev => { const next = new Set(prev); next.delete(studentId); return next })
  }
 }, [students])

 const handleConfirmDelete = useCallback(async () => {
  if (!activeDeleteStudent) return;
  const studentId = activeDeleteStudent.id;
  const name = `${activeDeleteStudent.first_name} ${activeDeleteStudent.last_name}`;
  setProcessingIds(prev => { const next = new Set(prev); next.add(studentId); return next })
  const toastId = toast.loading(`🗑️ Purging ${name}...`)
  
  try {
   setExitingRows(prev => ({ ...prev, [studentId]: true }))
   await new Promise(resolve => setTimeout(resolve, 280))
   
   setHiddenRows(prev => { const next = new Set(prev); next.add(studentId); return next })
   
   const result = await deleteApplicant(studentId);
   
   if (result.success) {
    setStudents(prev => prev.filter(s => s.id !== studentId));
    
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('activity_logs').insert([{
      admin_id: user?.id,
      admin_name: user?.user_metadata?.username || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Authorized Admin',
      action_type: 'DELETED',
      student_name: name,
      details: "Deleted from the list"
    }]);

    toast.success(`✓ Record Erased: ${name}`, { id: toastId });
    setDeleteModalOpen(false);
    setActiveDeleteStudent(null);
   }
  } catch (err: any) {
   toast.error("❌ Delete failed", { id: toastId })
   setExitingRows(prev => { const next = { ...prev }; delete next[studentId]; return next })
   setHiddenRows(prev => { const next = new Set(prev); next.delete(studentId); return next })
  } finally {
   setProcessingIds(prev => { const next = new Set(prev); next.delete(studentId); return next })
  }
 }, [activeDeleteStudent, students])

 const processBulkUpdate = useCallback(async (newStatus: string, feedback?: string) => {
  const count = selectedIds.length
  
  setProcessingIds(prev => {
    const next = new Set(prev)
    selectedIds.forEach(id => next.add(id))
    return next
  })
  
  const toastId = toast.loading(`⚡ Processing ${count} students...`)
  
  try {
   setExitingRows(prev => {
     const next = { ...prev }
     selectedIds.forEach(id => { next[id] = true })
     return next
   })
   
   await new Promise(resolve => setTimeout(resolve, 280))

   setHiddenRows(prev => {
     const next = new Set(prev)
     selectedIds.forEach(id => next.add(id))
     return next
   })

   const targetStatus = newStatus === 'Accepted' ? 'Approved' : newStatus
   
   const result = await bulkUpdateApplicantStatus(selectedIds, targetStatus, feedback);

   if (result.success) {
     const { data: { user } } = await supabase.auth.getUser();
     const selectedStudents = students.filter(s => selectedIds.includes(s.id));

     const logEntries = selectedStudents.map(s => ({
       admin_id: user?.id,
       admin_name: user?.user_metadata?.username || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Authorized Admin',
       action_type: newStatus.toUpperCase(),
       student_name: `${s.first_name} ${s.last_name}`,
       student_id: s.id,
       student_image: s.two_by_two_url || s.profile_2x2_url,
       details: newStatus === 'Accepted' ? "Student Accepted" : (newStatus === 'Pending' ? "Student Returned to Pending" : `Batch update to ${newStatus}${feedback ? `: ${feedback}` : ''}`)
     }));

     await supabase.from('activity_logs').insert(logEntries);

     const successfulUpdates = result.results.filter(r => r.success);
     setStudents(prev => prev.map(s => {
       const update = successfulUpdates.find(u => u.id === s.id);
       if (update) {
         return {
           ...s,
           status: targetStatus,
           section_id: update.assignedSectionId || null,
           section: update.assignedSection || 'Unassigned'
         };
       }
       return s;
     }));
     
     toast.success(`✨ ${count} students → ${newStatus}`, { id: toastId })
     
     setBulkDeclineModalOpen(false)
     setDeclineReason("")
   }
  } catch (err: any) {
   toast.error("❌ Bulk action failed", { id: toastId })
   setExitingRows(prev => { const next = { ...prev }; selectedIds.forEach(id => delete next[id]); return next })
   setHiddenRows(prev => { const next = new Set(prev); selectedIds.forEach(id => next.delete(id)); return next })
  } finally {
   setSelectedIds([])
   setExitingRows(prev => {
     const next = { ...prev }
     selectedIds.forEach(id => delete next[id])
     return next
   })
   setHiddenRows(prev => {
     const next = new Set(prev)
     selectedIds.forEach(id => next.delete(id))
     return next
   })
   setProcessingIds(prev => {
     const next = new Set(prev)
     selectedIds.forEach(id => next.delete(id))
     return next
   })
  }
 }, [selectedIds, students])

 const processBulkDelete = useCallback(async () => {
  const count = selectedIds.length
  setProcessingIds(prev => {
    const next = new Set(prev)
    selectedIds.forEach(id => next.add(id))
    return next
  })
  
  const toastId = toast.loading(`🗑️ Purging ${count} records...`)
  
  try {
   setExitingRows(prev => {
     const next = { ...prev }
     selectedIds.forEach(id => { next[id] = true })
     return next
   })
   
   await new Promise(resolve => setTimeout(resolve, 280))

   setHiddenRows(prev => {
     const next = new Set(prev)
     selectedIds.forEach(id => next.add(id))
     return next
   })

   const { data: { user } } = await supabase.auth.getUser();
   const selectedStudents = students.filter(s => selectedIds.includes(s.id));
   
   const logEntries = selectedStudents.map(s => ({
     admin_id: user?.id,
     admin_name: user?.user_metadata?.username || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Authorized Admin',
     action_type: 'DELETED',
     student_name: `${s.first_name} ${s.last_name}`,
     details: "Batch deletion from database"
   }));

   await Promise.all([
     bulkDeleteApplicants(selectedIds),
     supabase.from('activity_logs').insert(logEntries)
   ])

   setStudents(prev => prev.filter(s => !selectedIds.includes(s.id)))
   
   toast.success(`✓ ${count} records deleted`, { id: toastId })
   setBulkDeleteModalOpen(false)
  } catch (err: any) {
   toast.error("❌ Bulk deletion failed", { id: toastId })
   setExitingRows(prev => { const next = { ...prev }; selectedIds.forEach(id => delete next[id]); return next })
   setHiddenRows(prev => { const next = new Set(prev); selectedIds.forEach(id => next.delete(id)); return next })
  } finally {
   setSelectedIds([])
   setExitingRows(prev => {
     const next = { ...prev }
     selectedIds.forEach(id => delete next[id])
     return next
   })
   setHiddenRows(prev => {
     const next = new Set(prev)
     selectedIds.forEach(id => next.delete(id))
     return next
   })
   setProcessingIds(prev => {
     const next = new Set(prev)
     selectedIds.forEach(id => next.delete(id))
     return next
   })
  }
 }, [selectedIds, students])

 const handleBulkAction = useCallback((newStatus: string) => {
  if (newStatus === 'Rejected') {
    setBulkDeclineModalOpen(true)
  } else {
    processBulkUpdate(newStatus)
  }
 }, [processBulkUpdate])

 const toggleSelect = useCallback((id: string) => {
  setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
 }, [])

 const toggleSelectAll = useCallback(() => {
  if (selectedIds.length === filteredStudents.length) setSelectedIds([])
  else setSelectedIds(filteredStudents.map(s => s.id))
 }, [selectedIds.length, filteredStudents])

 const selectedStudentForDialog = useMemo(() => {
  if (!openStudentDialog) return null
  return filteredStudents.find(s => s.id === openStudentDialog) || students.find(s => s.id === openStudentDialog)
 }, [openStudentDialog, filteredStudents, students])

 const exportToCSV = () => {
  const headers = ["LRN", "Full Name", "Gender", "Strand", "GWA", "Status", "School Year"]
  const rows = filteredStudents.map(s => [
   s.lrn, `${s.first_name} ${s.last_name}`, s.gender, s.strand, s.gwa_grade_10, s.status, s.school_year
  ])
  const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = `ACLC_Applicants_${filter}_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
 }

 if (loading && students.length === 0) return (
  <div className="h-screen flex flex-col items-center justify-center gap-4 text-slate-400">
   <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
   <p className="text-[10px] font-black uppercase tracking-widest text-center animate-pulse">⚡ Syncing Admissions Matrix...</p>
  </div>
 )

 return (
  <div className="relative min-h-screen [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] transition-colors duration-500">
   <style jsx global>{`
     body { overflow-y: auto; }
     ::-webkit-scrollbar { display: none; }
     * { -ms-overflow-style: none; scrollbar-width: none; }
   `}</style>

   <StarConstellation />
   
   <div className="relative z-10 space-y-6 md:space-y-8 p-4 md:p-8 animate-in fade-in duration-700 pb-32">
    {(strandStats.ICT || strandStats.GAS) && (
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3 text-amber-500 mb-2 animate-pulse">
        <AlertTriangle size={20} className="shrink-0" />
        <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
          SYSTEM ALERT: {strandStats.ICT && strandStats.GAS ? "ALL SECTIONS" : (strandStats.ICT ? "ICT STRAND" : "GAS STRAND")} AT FULL CAPACITY. 
          <span className="opacity-70 block mt-1 font-bold">New applicants cannot be approved until space is available.</span>
        </p>
      </div>
    )}

    <ApplicantsHeader 
      isDarkMode={isDarkMode}
      loading={loading}
      config={config}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      fetchStudents={fetchStudents}
      exportToCSV={exportToCSV}
    />

    <ApplicantsFilter 
      isDarkMode={isDarkMode}
      filter={filter}
      setFilter={setFilter}
      students={students}
      setSelectedIds={setSelectedIds}
      sortBy={sortBy}
      setSortBy={setSortBy}
      sortDropdownOpen={sortDropdownOpen}
      setSortDropdownOpen={setSortDropdownOpen}
    />

    <ApplicantsTable 
      isDarkMode={isDarkMode}
      filteredStudents={filteredStudents}
      selectedIds={selectedIds}
      toggleSelect={toggleSelect}
      toggleSelectAll={toggleSelectAll}
      hiddenRows={hiddenRows}
      exitingRows={exitingRows}
      animatingIds={animatingIds}
      setOpenStudentDialog={setOpenStudentDialog}
      handleExit={handleExit}
      handleStatusChange={handleStatusChange}
      setActiveDeclineStudent={setActiveDeclineStudent}
      setDeclineModalOpen={setDeclineModalOpen}
      setActiveDeleteStudent={setActiveDeleteStudent}
      setDeleteModalOpen={setDeleteModalOpen}
      strandStats={strandStats}
    />
   </div>

   {selectedStudentForDialog && (
    <Dialog open={!!openStudentDialog} onOpenChange={(open) => !open && setOpenStudentDialog(null)}>
     <DialogContent className="w-[95vw] md:w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[32px] md:rounded-[48px] p-0 border-none shadow-2xl [&>button]:text-red-500">
      <DialogHeader className="sr-only">
       <DialogTitle>Profile Detail: {selectedStudentForDialog.first_name} {selectedStudentForDialog.last_name}</DialogTitle>
       <DialogDescription>Verification matrix for applicant {selectedStudentForDialog.lrn}</DialogDescription>
      </DialogHeader>
      <StudentDossier 
       student={selectedStudentForDialog} 
       onOpenFile={(url, label) => {
        setViewingFile({ url, label });
        setRotation(0);
        setViewerOpen(true);
       }}
       isDarkMode={isDarkMode}
      />
     </DialogContent>
    </Dialog>
   )}

   <DocumentViewerModal 
     viewerOpen={viewerOpen}
     setViewerOpen={setViewerOpen}
     viewingFile={viewingFile}
     rotation={rotation}
     setRotation={setRotation}
   />

   <ApplicantModals 
     isDarkMode={isDarkMode}
     declineModalOpen={declineModalOpen}
     setDeclineModalOpen={setDeclineModalOpen}
     activeDeclineStudent={activeDeclineStudent}
     declineReason={declineReason}
     setDeclineReason={setDeclineReason}
     handleExit={handleExit}
     handleStatusChange={handleStatusChange}
     bulkDeclineModalOpen={bulkDeclineModalOpen}
     setBulkDeclineModalOpen={setBulkDeclineModalOpen}
     selectedIds={selectedIds}
     students={students}
     processBulkUpdate={processBulkUpdate}
     deleteModalOpen={deleteModalOpen}
     setDeleteModalOpen={setDeleteModalOpen}
     activeDeleteStudent={activeDeleteStudent}
     handleConfirmDelete={handleConfirmDelete}
     bulkDeleteModalOpen={bulkDeleteModalOpen}
     setBulkDeleteModalOpen={setBulkDeleteModalOpen}
     processBulkDelete={processBulkDelete}
   />

   <BulkActionsFloatingBar 
     selectedIds={selectedIds}
     filter={filter}
     handleBulkAction={handleBulkAction}
     setBulkDeleteModalOpen={setBulkDeleteModalOpen}
     setSelectedIds={setSelectedIds}
   />
  </div>
 )
}