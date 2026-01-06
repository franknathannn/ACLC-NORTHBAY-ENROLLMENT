"use client"

import { useEffect, useState, useCallback, memo } from "react"
import { supabase } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import { 
  Search, Filter, Undo2, AlertTriangle, CheckCircle2, 
  XCircle, User, ShieldAlert, History, RefreshCw,
  ArrowRightLeft, Trash2, FileText, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useTheme } from "@/hooks/useTheme"
import { themeColors } from "@/lib/themeColors"

// Optimized Background
const StarConstellation = memo(function StarConstellation() {
  const [stars, setStars] = useState<Array<{x: number, y: number, size: number}>>([])
  useEffect(() => {
    const newStars = Array.from({ length: 30 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1
    }))
    setStars(newStars)
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <svg className="w-full h-full opacity-20">
        {stars.map((star, i) => (
          <circle key={i} cx={`${star.x}%`} cy={`${star.y}%`} r={star.size} fill="rgb(59 130 246)" className="animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </svg>
    </div>
  )
})

export default function ActivityLogsPage() {
  const { isDarkMode: themeDarkMode } = useTheme()
  const [isDarkMode, setIsDarkMode] = useState(themeDarkMode)
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<string>("ALL")
  const [undoOpen, setUndoOpen] = useState(false)
  const [activeLog, setActiveLog] = useState<any>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [clearAllOpen, setClearAllOpen] = useState(false)
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set())
  const [user, setUser] = useState<any>(null)

  const fetchLogs = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true)
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*, students(lrn, gender)')
        .order('created_at', { ascending: false })
        .limit(30)
      if (error) throw error
      setLogs(data || [])
    } catch (err) {
      console.error("Log Sync Error:", err)
      if (!isBackground) toast.error("Could not load logs.")
    } finally {
      if (!isBackground) setLoading(false)
    }
  }, [])

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUser(user)
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

  // --- CLEANUP: Maintain only 50 records ---
  useEffect(() => {
    const cleanupLogs = async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select('id')
        .order('created_at', { ascending: false })
        .range(30, 1000)
      
      if (data && data.length > 0) {
        await supabase.from('activity_logs').delete().in('id', data.map(l => l.id))
      }
    }
    if (logs.length >= 30) cleanupLogs()
  }, [logs])

  useEffect(() => {
    checkUser()
    fetchLogs()
    
    const channel = supabase
      .channel('activity_logs_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, () => {
        fetchLogs(true)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          fetchLogs(true)
        }
      })
    return () => { supabase.removeChannel(channel) }
  }, [fetchLogs, checkUser])

  const handleUndo = async () => {
    if (!activeLog) return
    
    if (!['ACCEPTED', 'APPROVED', 'REJECTED', 'PENDING', 'DELETED'].includes(activeLog.action_type)) {
      toast.error("Action restricted.")
      setUndoOpen(false)
      return
    }

    if (activeLog.action_type === 'DELETED' && !activeLog.student_id) {
       toast.error("Cannot revert: Record was permanently deleted.")
       setUndoOpen(false)
       return
    }

    if (!activeLog.student_id) return

    const toastId = toast.loading("Reverting status...")
    try {
      const { error } = await supabase
        .from('students')
        .update({ status: 'Pending', registrar_feedback: null })
        .eq('id', activeLog.student_id)

      if (error) throw error

      await supabase.from('activity_logs').insert([{
        admin_id: user?.id,
        admin_name: user?.user_metadata?.full_name || 'Admin',
        action_type: 'UNDO',
        student_name: activeLog.student_name,
        details: `Reverted ${activeLog.action_type} command.`
      }])

      await supabase.from('activity_logs').delete().eq('id', activeLog.id)
      
      toast.success("Action Reverted", { id: toastId })
      setExitingIds(prev => new Set(prev).add(activeLog.id))
      setTimeout(() => {
        setUndoOpen(false)
        setLogs(prev => prev.filter(l => l.id !== activeLog.id))
      }, 500)
    } catch (err: any) {
      toast.error("Undo failed: " + err.message, { id: toastId })
    }
  }

  const filteredLogs = logs.filter(log => {
    const search = searchTerm.toLowerCase()
    return (
      log.student_name?.toLowerCase().includes(search) || 
      log.admin_name?.toLowerCase().includes(search) ||
      log.details?.toLowerCase().includes(search)
    ) && (filter === "ALL" || log.action_type === filter)
  })

  const handleClearAllLogs = async () => {
    const toastId = toast.loading("Clearing all logs...")
    try {
      const { error } = await supabase.from('activity_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (error) throw error
      setLogs([])
      setClearAllOpen(false)
      toast.success("All logs cleared", { id: toastId })
    } catch (err: any) {
      toast.error("Failed to clear logs: " + err.message, { id: toastId })
    }
  }

  const confirmDeleteLog = async () => {
    if (!activeLog) return
    const id = activeLog.id
    setDeleteOpen(false)
    setExitingIds(prev => new Set(prev).add(id))
    setTimeout(async () => {
      const { error } = await supabase.from('activity_logs').delete().eq('id', id)
      if (!error) {
        setLogs(prev => prev.filter(l => l.id !== id))
        toast.success("Log Erased")
      } else toast.error("Failed to delete log")
    }, 500)
  }

  return (
    <div 
      className="relative min-h-screen transition-colors duration-500"
    >
      <StarConstellation />

      <div className="relative z-10 p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-32">
        
        {/* HEADER SECTION */}
        <div 
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 backdrop-blur-md p-6 md:p-8 rounded-[32px] shadow-xl border transition-all duration-500"
          style={{
            backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.2)'
          }}
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase leading-none italic" style={{ color: isDarkMode ? themeColors.dark.text.primary : themeColors.light.text.primary }}>System Logs</h1>
            <p className="font-medium italic text-sm mt-2 flex items-center gap-2" style={{ color: isDarkMode ? themeColors.dark.text.secondary : themeColors.light.text.secondary }}>
              <History size={14} className="text-blue-500" />
              Enrollment System Activity Logs for {user?.user_metadata?.full_name || "Authorized Admin"}
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
             <Button onClick={() => setClearAllOpen(true)} variant="ghost" className="h-12 px-4 rounded-2xl text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-all font-black uppercase text-[10px] tracking-widest shrink-0">Clear Logs</Button>
             <Button onClick={() => fetchLogs(false)} variant="ghost" className="h-12 w-12 rounded-2xl text-slate-400 hover:text-blue-600 transition-transform hover:scale-110 active:scale-95"><RefreshCw className={loading ? "animate-spin" : ""} size={20}/></Button>
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search..." 
                  className="pl-10 h-12 rounded-2xl border-slate-200 dark:border-white/10 font-bold text-sm focus:scale-[1.02] transition-transform" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    backgroundColor: isDarkMode ? themeColors.dark.surface : themeColors.light.surface,
                    color: isDarkMode ? themeColors.dark.text.primary : themeColors.light.text.primary
                  }}
                />
             </div>
          </div>
        </div>

        {/* FEED SECTION */}
        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <div 
              className="text-center py-20 text-slate-400 font-bold uppercase text-xs tracking-widest rounded-[32px] border-2 border-dashed border-slate-100 dark:border-white/5 transition-all duration-500"
              style={{ backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.5)' }}
            >
              No Node Data Recorded
            </div>
          ) : (
            filteredLogs.map((log) => (
              <LogItem 
                key={log.id} 
                log={log} 
                onUndo={() => { setActiveLog(log); setUndoOpen(true); }} 
                onDelete={() => { setActiveLog(log); setDeleteOpen(true); }}
                isExiting={exitingIds.has(log.id)}
                isDarkMode={isDarkMode}
              />
            ))
          )}
        </div>
      </div>

      {/* REVERSAL MODAL */}
      <Dialog open={undoOpen} onOpenChange={setUndoOpen}>
        <DialogContent 
          className="w-[95vw] max-w-sm rounded-[32px] p-0 overflow-hidden border-none shadow-2xl z-[100] max-h-[90vh] flex flex-col transition-colors duration-500"
          style={{ backgroundColor: isDarkMode ? themeColors.dark.surface : themeColors.light.surface }}
        >
          <div className="bg-blue-600 p-8 text-white border-b-4 border-blue-400">
            <DialogTitle className="text-xl font-black uppercase italic tracking-tighter">Confirm Reversal</DialogTitle>
            <DialogDescription className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mt-1">Undo Action Node</DialogDescription>
          </div>
          <div className="p-8 space-y-4">
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300 italic">
              This will revert <span className="text-blue-600 dark:text-blue-400">{activeLog?.student_name}</span> back to <span className="text-amber-500 underline underline-offset-4">PENDING</span> status.
            </p>
            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-0">
              <Button variant="ghost" onClick={() => setUndoOpen(false)} className="w-full sm:w-auto rounded-xl font-black uppercase text-[10px] hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">Abort</Button>
              <Button onClick={handleUndo} className="w-full sm:w-auto rounded-xl bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] transition-transform active:scale-95 shadow-xl shadow-blue-500/20">Revert Matrix</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE MODAL */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent 
          className="w-[95vw] max-w-sm rounded-[32px] p-0 overflow-hidden border-none shadow-2xl z-[100] max-h-[90vh] flex flex-col transition-colors duration-500"
          style={{ backgroundColor: isDarkMode ? themeColors.dark.surface : themeColors.light.surface }}
        >
          <div className="bg-red-600 p-8 text-white border-b-4 border-red-800">
            <DialogTitle className="text-xl font-black uppercase italic tracking-tighter text-white">Confirm Purge</DialogTitle>
            <DialogDescription className="text-red-200 text-[10px] font-bold uppercase tracking-widest mt-1">Permanent Deletion</DialogDescription>
          </div>
          <div className="p-8 space-y-4">
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300 italic">
              Are you sure you want to permanently delete this log entry for <span className="text-red-600 dark:text-red-400">{activeLog?.student_name}</span>?
            </p>
            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-0">
              <Button variant="ghost" onClick={() => setDeleteOpen(false)} className="w-full sm:w-auto rounded-xl font-black uppercase text-[10px] dark:text-slate-400 dark:hover:text-white">Cancel</Button>
              <Button onClick={confirmDeleteLog} className="w-full sm:w-auto rounded-xl bg-red-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-transform active:scale-95 shadow-xl shadow-red-500/20">Purge Log</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* SYSTEM WIPE MODAL */}
      <Dialog open={clearAllOpen} onOpenChange={setClearAllOpen}>
        <DialogContent 
          className="w-[95vw] max-w-sm rounded-[32px] p-0 overflow-hidden border-none shadow-2xl z-[100] max-h-[90vh] flex flex-col transition-colors duration-500"
          style={{ backgroundColor: isDarkMode ? themeColors.dark.surface : themeColors.light.surface }}
        >
          <div className="bg-slate-950 p-8 text-white border-b-4 border-blue-600">
            <DialogTitle className="text-xl font-black uppercase italic tracking-tighter text-white">System Wipe</DialogTitle>
            <DialogDescription className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mt-1">Delete All Activity Records</DialogDescription>
          </div>
          <div className="p-8 space-y-4">
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300 italic">
              This will permanently delete <span className="text-red-600 font-black">ALL</span> activity logs. This action cannot be undone.
            </p>
            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-0">
              <Button variant="ghost" onClick={() => setClearAllOpen(false)} className="w-full sm:w-auto rounded-xl font-black uppercase text-[10px] dark:text-slate-400 dark:hover:text-white">Cancel</Button>
              <Button onClick={handleClearAllLogs} className="w-full sm:w-auto rounded-xl bg-slate-950 text-white font-black uppercase text-[10px] tracking-widest hover:bg-black transition-transform active:scale-95 shadow-xl">Confirm Wipe</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const LogItem = memo(function LogItem({ log, onUndo, onDelete, isExiting, isDarkMode }: { log: any, onUndo: () => void, onDelete: () => void, isExiting: boolean, isDarkMode: boolean }) {
  const isUndoable = ['ACCEPTED', 'APPROVED', 'REJECTED', 'PENDING', 'DELETED'].includes(log.action_type)
  const [adminDetails, setAdminDetails] = useState({ name: log.admin_name || "Admin", avatar: log.admin_image || null })

  useEffect(() => {
    const fetchAdminProfile = async () => {
      if (!log.admin_id) return
      const { data } = await supabase.from('admin_profiles').select('full_name, avatar_url').eq('id', log.admin_id).single()
      if (data) setAdminDetails({ name: data.full_name, avatar: data.avatar_url })
    }
    fetchAdminProfile()
  }, [log.admin_id])

  const adminAvatar = adminDetails.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${adminDetails.name}&backgroundColor=1e293b`
  const gender = log.students?.gender || 'Male'

  return (
    <div className={cn(
      "group flex flex-col md:flex-row gap-4 md:gap-6 p-6 border shadow-sm transition-[transform,background-color,border-color,box-shadow,opacity] duration-300 ease-out items-start md:items-center relative overflow-hidden",
      isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100',
      "hover:shadow-xl dark:hover:shadow-blue-500/5 hover:scale-[1.01]"
    )}
    style={{
      backgroundColor: isDarkMode ? themeColors.dark.surface : themeColors.light.surface,
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgb(241 245 249)'
    }}>
      {/* NO-SHIFT RIBBON INDICATOR */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-[4px] opacity-0 group-hover:opacity-100 transition-opacity z-10",
        gender === 'Female' ? 'bg-pink-500 shadow-[2px_0_10px_rgba(236,72,153,0.3)]' : 'bg-blue-500 shadow-[2px_0_10px_rgba(59,130,246,0.3)]'
      )} />

      {/* ADMIN IDENTITY NODE */}
      <div className="flex items-center gap-4 shrink-0 min-w-[200px] relative z-20">
        <div className="relative">
          <img src={adminAvatar} alt="Admin" className="w-11 h-11 rounded-2xl border-2 border-white dark:border-slate-800 shadow-md object-cover transition-transform group-hover:scale-110" />
          <div className="absolute -bottom-1 -right-1 bg-slate-950 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase border border-white/10 italic drop-shadow-sm">Admin</div>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-black uppercase tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" style={{ color: isDarkMode ? themeColors.dark.text.primary : themeColors.light.text.primary }}>{adminDetails.name}</span>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
        </div>
      </div>

      {/* ACTION BLOCK */}
      <div className="flex-1 space-y-2 relative z-20">
        <div className="flex items-center gap-2 flex-wrap">
          <ActionBadge type={log.action_type} />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 italic">Target: <span className="font-black uppercase not-italic tracking-tighter" style={{ color: isDarkMode ? themeColors.dark.text.primary : themeColors.light.text.primary }}>{log.student_name}</span></span>
            <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 tracking-[0.2em]">{log.students?.lrn ? `LRN - ${log.students.lrn}` : "DATASET NULL"}</span>
          </div>
        </div>
        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 italic border-l-2 border-blue-500 pl-3 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 py-1 pr-2 rounded-r-md transition-colors">{log.details || "Registry Automated Log."}</p>
      </div>

      {/* TARGET ASSET VISUAL */}
      {log.student_image && (
        <div className={cn(
          "hidden md:block w-12 h-12 rounded-full bg-white p-1 border-2 transition-all duration-500 shrink-0 group-hover:scale-110 shadow-sm",
          gender === 'Female' ? 'border-pink-100 dark:border-slate-700 group-hover:border-pink-400' : 'border-blue-100 dark:border-slate-700 group-hover:border-blue-400'
        )}>
          <img src={log.student_image} className="w-full h-full object-cover rounded-full group-hover:opacity-100" />
        </div>
      )}

      {/* COMMAND CONTROL */}
      <div className="w-full md:w-auto flex flex-col gap-2 items-end relative z-20">
        {isUndoable && (
          <Button 
            onClick={(e) => { e.stopPropagation(); onUndo(); }} 
            size="sm" 
            variant="ghost" 
            className="rounded-lg h-9 px-4 text-[9px] font-black uppercase tracking-widest text-blue-500 dark:text-blue-400 transition-colors w-28 hover:scale-105 active:scale-95 border border-transparent"
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgb(37 99 235)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = isDarkMode ? 'rgb(96 165 250)' : 'rgb(59 130 246)'; }}
          >
            <Undo2 size={12} className="mr-2" /> Revert
          </Button>
        )}
        <Button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }} 
            size="sm" 
            variant="ghost" 
            className="rounded-lg h-9 px-4 text-[9px] font-black uppercase tracking-widest text-red-400 dark:text-red-500 transition-colors w-28 hover:scale-105 active:scale-90 border border-transparent"
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgb(220 38 38)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = isDarkMode ? 'rgb(239 68 68)' : 'rgb(248 113 113)'; }}
        >
            <Trash2 size={12} className="mr-2" /> Purge
        </Button>
      </div>
    </div>
  )
})

const ActionBadge = memo(function ActionBadge({ type }: { type: string }) {
  const styles: any = {
    ACCEPTED: "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900",
    APPROVED: "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900",
    REJECTED: "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900",
    DELETED: "bg-slate-100 dark:bg-black text-slate-600 dark:text-blue-500 border-slate-200 dark:border-white/10",
    UNDO: "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900",
    SWITCHED: "bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900",
    PENDING: "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900"
  }
  const icons: any = {
    ACCEPTED: <CheckCircle2 size={12} className="mr-1.5" />,
    APPROVED: <CheckCircle2 size={12} className="mr-1.5" />,
    REJECTED: <XCircle size={12} className="mr-1.5" />,
    DELETED: <Trash2 size={12} className="mr-1.5" />,
    UNDO: <Undo2 size={12} className="mr-1.5" />,
    SWITCHED: <ArrowRightLeft size={12} className="mr-1.5" />,
    PENDING: <History size={12} className="mr-1.5" />
  }

  return (
    <Badge className={cn(styles[type] || "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400", "border px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center hover:scale-105 transition-transform cursor-default italic")}>
      {icons[type] || <FileText size={12} className="mr-1.5" />}
      {type}
    </Badge>
  )
})