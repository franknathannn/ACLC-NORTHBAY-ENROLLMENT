"use client"

import { useEffect, useState, useMemo, useCallback, memo, useRef } from "react"
import { supabase } from "@/lib/supabase/client"
import { recordYearlySnapshot, deleteSnapshot } from "@/lib/actions/history" 
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from "recharts"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import { 
  Table, TableBody, TableCell, TableRow, TableHeader, TableHead 
} from "@/components/ui/table"
import { 
  Users, Cpu, BookText, Clock, ArrowUpRight, TrendingUp,
  Loader2, GraduationCap, TrendingDown, Target, User,
  History, CheckCircle2, Trash2, Zap, 
  PieChart as PieIcon, Activity,
  UserCircle2, ChevronRight, Calendar,
  Trophy, Timer, AlertTriangle, FileDown, Banknote, Landmark, Minus
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { format, subDays, isSameDay, parseISO } from "date-fns"
import { ThemedText } from "@/components/ThemedText"
import { useTheme } from "@/hooks/useTheme"
import { themeColors } from "@/lib/themeColors"
import { useRouter } from "next/navigation"

// Animated Number Component
const AnimatedNumber = memo(({ value, duration = 800 }: { value: number, duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(value)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (displayValue === value) return
    
    setIsAnimating(true)
    const startValue = displayValue
    const diff = value - startValue
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValue + (diff * easeProgress))
      
      setDisplayValue(current)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
      }
    }
    
    requestAnimationFrame(animate)
  }, [value, displayValue, duration])

  return (
    <span className={`inline-block transition-all duration-300 ${isAnimating ? 'scale-110 text-purple-600 dark:text-purple-400' : ''}`}>
      {displayValue.toLocaleString()}
    </span>
  )
})
AnimatedNumber.displayName = "AnimatedNumber"

// Memoized components with theme support
const MetricCard = memo(({ label, value, colorLight, colorDark, icon, isDarkMode, textColor = "text-white" }: any) => {
  return (
    <Card 
      className={`p-6 md:p-10 rounded-[32px] md:rounded-[56px] ${textColor} flex justify-between items-center shadow-2xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-500 border-none`}
      style={{
        background: isDarkMode ? colorDark : colorLight
      }}
    >
      <div className="absolute top-0 right-0 w-32 md:w-48 h-32 md:h-48 bg-white/5 blur-[80px] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
      <div className="relative z-10">
        <p className="text-[9px] md:text-[11px] font-black uppercase opacity-60 tracking-[0.3em] mb-2">{label}</p>
        <h3 className="text-4xl md:text-7xl font-black tracking-tighter leading-none">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </h3>
      </div>
      <div className="w-16 md:w-24 h-16 md:h-24 bg-white/10 rounded-[24px] md:rounded-[40px] flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-lg backdrop-blur-md border border-white/10">{icon}</div>
    </Card>
  )
})
MetricCard.displayName = "MetricCard"

const StatCard = memo(({ title, value, icon, color, bg, trend, isDarkMode, highlightColor }: any) => {
  const isHighlighted = !isDarkMode && highlightColor;

  return (
    <Card 
      className="p-6 md:p-10 rounded-[32px] md:rounded-[48px] flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 h-full group min-h-[180px]"
      style={{
        backgroundColor: isDarkMode ? themeColors.dark.surface : (isHighlighted ? highlightColor : themeColors.light.surface),
        borderColor: isDarkMode ? themeColors.dark.border : (isHighlighted ? 'transparent' : themeColors.light.border)
      }}
    >
      <div className="space-y-4 md:space-y-6">
        <div className={`w-12 md:w-16 h-12 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center text-xl md:text-3xl ${isDarkMode ? 'bg-slate-800' : (isHighlighted ? 'bg-white/20 text-white' : bg)} ${!isHighlighted ? color : ''} transition-transform group-hover:rotate-6 shadow-lg shadow-slate-100 dark:shadow-none`}>{icon}</div>
        <div>
          <ThemedText variant="h2" className="text-3xl md:text-5xl leading-none" isDarkMode={isDarkMode} style={isHighlighted ? { color: 'white' } : {}}>
            {typeof value === 'number' ? value.toLocaleString() : value ?? 0}
          </ThemedText>
          <ThemedText variant="caption" className="mt-2 md:mt-4 text-[10px] md:text-[11px]" isDarkMode={isDarkMode} style={isHighlighted ? { color: 'rgba(255,255,255,0.8)' } : {}}>{title}</ThemedText>
        </div>
      </div>
      <div className="mt-4 md:mt-8 pt-4 md:pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between" style={isHighlighted ? { borderColor: 'rgba(255,255,255,0.2)' } : {}}>
         <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest ${isHighlighted ? 'text-white/80' : 'text-slate-300 dark:text-slate-600'}`}>{trend}</span>
         <ArrowUpRight size={14} className={`${isHighlighted ? 'text-white/80' : 'text-slate-200 dark:text-slate-600'} group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors`} />
      </div>
    </Card>
  )
})
StatCard.displayName = "StatCard"

// Memoized chart component with theme support
const VelocityChart = memo(({ data, isDarkMode }: { data: any[], isDarkMode: boolean }) => (
  <div className="h-[250px] md:h-[350px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={isDarkMode ? "#60a5fa" : "#2563eb"} stopOpacity={0.2}/>
            <stop offset="95%" stopColor={isDarkMode ? "#60a5fa" : "#2563eb"} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#cbd5e1"} />
        <XAxis 
          dataKey="date" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fontWeight: 900, fill: isDarkMode ? '#94a3b8' : '#475569' }} 
          dy={10} 
          interval={0} 
          angle={-45} 
          textAnchor="end" 
          height={60} 
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fontWeight: 900, fill: isDarkMode ? '#94a3b8' : '#475569' }} 
        />
        <Tooltip 
          contentStyle={{ 
            borderRadius: '24px', 
            border: 'none', 
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)', 
            fontWeight: '900', 
            fontSize: '10px',
            backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#0f172a'
          }} 
        />
        <Area 
          type="monotone" 
          dataKey="count" 
          name="Applicants" 
          stroke={isDarkMode ? "#60a5fa" : "#2563eb"} 
          strokeWidth={4} 
          fillOpacity={1} 
          fill="url(#colorIn)" 
          animationDuration={3000} 
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
))
VelocityChart.displayName = "VelocityChart"

// Memoized pie chart component with theme support
const StrandPieChart = memo(({ data, total, isDarkMode }: { data: any[], total: number, isDarkMode: boolean }) => (
  <div className="h-[250px] md:h-[280px] w-full relative">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={10} dataKey="value" animationDuration={1500}>
          {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />)}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            borderRadius: '24px', 
            border: 'none', 
            boxShadow: '0 25px 50px rgba(0,0,0,0.3)', 
            fontWeight: '900', 
            fontSize: '10px',
            backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#0f172a'
          }} 
        />
      </PieChart>
    </ResponsiveContainer>
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
      <p className={`text-2xl md:text-3xl font-black leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{total}</p>
      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">Active</p>
    </div>
  </div>
))
StrandPieChart.displayName = "StrandPieChart"

export default function AdminDashboard() {
  const { isDarkMode: themeDarkMode, mounted } = useTheme()
  const [isDarkMode, setIsDarkMode] = useState(themeDarkMode)
  const router = useRouter()
  const [config, setConfig] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([]) 
  const [students, setStudents] = useState<any[]>([]) 
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCapturing, setIsCapturing] = useState(false)
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [snapshotToDelete, setSnapshotToDelete] = useState<{id: string, year: string} | null>(null)

  const [stats, setStats] = useState({
    totalAccepted: 0,
    ictAccepted: 0,
    gasAccepted: 0,
    pending: 0,
    ictDeclined: 0,
    gasDeclined: 0,
    declinedTotal: 0,
    males: 0,
    females: 0,
    pendingMales: 0,
    pendingFemales: 0
  })
  
  const [system, setSystem] = useState({
    currentCount: 0,
    capacity: 1000 
  })

  // Sync with hook on mount/update
  useEffect(() => {
    setIsDarkMode(themeDarkMode)
  }, [themeDarkMode])

  // Listen for manual layout toggles for live updates
  useEffect(() => {
    const handleThemeChange = (e: any) => {
      setIsDarkMode(e.detail.mode === 'dark')
    }
    window.addEventListener('theme-change', handleThemeChange)
    return () => window.removeEventListener('theme-change', handleThemeChange)
  }, [])

  // OPTIMIZED: Separated background updates from initial load
  const fetchStudents = useCallback(async (isBackground = false) => {
    try {
      const [studentsRes, configRes, sectionsRes, historyRes] = await Promise.all([
        supabase.from('students').select('id,first_name,last_name,gender,strand,status,student_category,gwa_grade_10,created_at').order('created_at', { ascending: false }),
        supabase.from('system_config').select('*').single(),
        supabase.from('sections').select('capacity'),
        supabase.from('enrollment_history').select('*').order('school_year', { ascending: false })
      ])

      if (studentsRes.error) throw studentsRes.error
      
      const allStudents = studentsRes.data || []
      
      // Update students state
      setStudents(allStudents)
      
      // Calculate stats
      const approved = allStudents.filter((s: any) => s.status === 'Approved' || s.status === 'Accepted')
      const pendingList = allStudents.filter((s: any) => s.status === 'Pending')
      const rejectedList = allStudents.filter((s: any) => s.status === 'Rejected' || s.status === 'Declined')

      setStats({
        totalAccepted: approved.length,
        ictAccepted: approved.filter((s: any) => s.strand === 'ICT').length,
        gasAccepted: approved.filter((s: any) => s.strand === 'GAS').length,
        pending: pendingList.length,
        ictDeclined: rejectedList.filter((s: any) => s.strand === 'ICT').length,
        gasDeclined: rejectedList.filter((s: any) => s.strand === 'GAS').length,
        declinedTotal: rejectedList.length,
        males: approved.filter((s: any) => s.gender === 'Male').length,
        females: approved.filter((s: any) => s.gender === 'Female').length,
        pendingMales: pendingList.filter((s: any) => s.gender === 'Male').length,
        pendingFemales: pendingList.filter((s: any) => s.gender === 'Female').length
      })

      if (configRes.data) setConfig(configRes.data)
      if (historyRes.data) setHistory(historyRes.data)
      
      if (sectionsRes.data) {
        const totalCapacity = sectionsRes.data.reduce((acc: number, s: any) => acc + (s.capacity || 40), 0) || 1000
        setSystem({
          currentCount: approved.length,
          capacity: totalCapacity
        })
      }

      if (!isBackground) {
        console.log("✅ Dashboard data loaded:", allStudents.length, "students")
      } else {
        console.log("🔄 Live update: Dashboard refreshed with", allStudents.length, "students")
      }
      
    } catch (error) {
      console.error("Dashboard sync error:", error)
      if (!isBackground) {
        toast.error("Failed to sync dashboard data")
      }
    }
  }, [])

  // Initial load
  useEffect(() => {
    const initDashboard = async () => {
      setLoading(true)
      await fetchStudents(false)
      setLoading(false)
    }
    
    initDashboard()
  }, [fetchStudents])

  // HYBRID APPROACH: Realtime + Polling Fallback
  useEffect(() => {
    console.log("🎯 Setting up live update system...")
    
    // POLLING FALLBACK - Checks every 3 seconds
    const pollingInterval = setInterval(() => {
      console.log("🔄 Polling for updates...")
      fetchStudents(true)
    }, 3000)

    // REALTIME SUBSCRIPTION - Primary method
    const channel = supabase
      .channel('dashboard_live_updates', {
        config: {
          broadcast: { self: true },
          presence: { key: 'dashboard' }
        }
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'students' 
      }, (payload) => {
        console.log('⚡ REALTIME EVENT:', payload.eventType, payload)
        fetchStudents(true)
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'sections' 
      }, (payload) => {
        console.log('⚡ Sections updated:', payload)
        fetchStudents(true)
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'system_config' 
      }, (payload) => {
        console.log('⚡ Config updated:', payload)
        fetchStudents(true)
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'enrollment_history' 
      }, (payload) => {
        console.log('⚡ History updated:', payload)
        fetchStudents(true)
      })
      .on('broadcast', { event: 'student_update' }, (payload) => {
        console.log('📡 Broadcast received:', payload)
        fetchStudents(true)
      })
      .subscribe((status) => {
        console.log("📊 Subscription status:", status)
        if (status === 'SUBSCRIBED') {
          console.log("✅ Realtime subscription ACTIVE")
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Subscription error - polling will handle updates')
        } else if (status === 'TIMED_OUT') {
          console.error('⏱️ Subscription timeout - polling will handle updates')
        }
      })

    return () => {
      console.log("🔌 Cleaning up live update system")
      clearInterval(pollingInterval)
      supabase.removeChannel(channel)
    }
  }, [fetchStudents])

  const comparison = useMemo(() => {
    if (history.length === 0) return { diff: 0, status: 'baseline', percent: '0', prevYear: '' };
    
    let baselineSnapshot = history[0];
    // If the latest snapshot is the current year, compare against the previous year instead
    if (config?.school_year && baselineSnapshot.school_year === config.school_year) {
      if (history.length > 1) {
        baselineSnapshot = history[1];
      } else {
        return { diff: 0, status: 'baseline', percent: '0', prevYear: baselineSnapshot.school_year };
      }
    }

    const prevTotal = baselineSnapshot.male_total + baselineSnapshot.female_total;
    if (prevTotal === 0) return { diff: 0, status: 'baseline', percent: '0', prevYear: baselineSnapshot.school_year };
    const diff = ((stats.totalAccepted - prevTotal) / prevTotal) * 100;
    return {
      percent: Math.abs(diff).toFixed(1),
      status: diff >= 0 ? 'growth' : 'decline',
      prevYear: baselineSnapshot.school_year,
      diff
    };
  }, [history, stats.totalAccepted, config?.school_year]);

  const revenueMatrix = useMemo(() => {
    const dynamicVoucher = config?.voucher_value ?? 0;
    const qualifiedStudents = students.filter(s => 
      (s.status === 'Accepted' || s.status === 'Approved') && 
      (s.student_category?.toLowerCase().includes("jhs") || s.student_category === "Standard")
    );
    const qualifiedICT = qualifiedStudents.filter(s => s.strand === 'ICT').length;
    const qualifiedGAS = qualifiedStudents.filter(s => s.strand === 'GAS').length;
    const currentRevenue = qualifiedStudents.length * dynamicVoucher;
    const totalPotential = system.capacity * dynamicVoucher;
    const fundingProgress = totalPotential > 0 ? (currentRevenue / totalPotential) * 100 : 0;
    return { currentRevenue, totalPotential, fundingProgress, qualifiedICT, qualifiedGAS, voucherLabel: dynamicVoucher };
  }, [students, system.capacity, config?.voucher_value]);

  const trendData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), i);
      return { date: format(date, 'MMM dd'), fullDate: date, count: 0 };
    }).reverse();
    
    students.forEach(student => {
      const studentDate = parseISO(student.created_at);
      const match = last30Days.find(d => isSameDay(d.fullDate, studentDate));
      if (match) match.count += 1;
    });
    
    return last30Days;
  }, [students]);

  const prediction = useMemo(() => {
    const totalNewStudents = trendData.reduce((acc, curr) => acc + curr.count, 0);
    const dailyVelocity = totalNewStudents / 30; 
    const remainingSlots = system.capacity - stats.totalAccepted;
    
    if (dailyVelocity <= 0 || remainingSlots <= 0) {
      return { days: 0, speed: dailyVelocity.toFixed(2) };
    }
    
    const daysRemaining = Math.ceil(remainingSlots / dailyVelocity);
    return { 
      days: daysRemaining, 
      speed: dailyVelocity.toFixed(2) 
    };
  }, [trendData, system.capacity, stats.totalAccepted]);

  // Enrollment Spike Analysis
  const spikeAnalysis = useMemo(() => {
    const last7Days = trendData.slice(-7);
    const prev7Days = trendData.slice(-14, -7);
    
    const last7Total = last7Days.reduce((acc, curr) => acc + curr.count, 0);
    const prev7Total = prev7Days.reduce((acc, curr) => acc + curr.count, 0);
    
    const weeklyChange = prev7Total > 0 ? ((last7Total - prev7Total) / prev7Total) * 100 : 0;
    const peakDay = [...trendData].sort((a, b) => b.count - a.count)[0];
    const avgDaily = trendData.reduce((acc, curr) => acc + curr.count, 0) / 30;
    
    const remainingCapacity = system.capacity - stats.totalAccepted;
    const capacityProgress = (stats.totalAccepted / system.capacity) * 100;
    
    // Determine alert level
    let alertLevel: 'safe' | 'warning' | 'critical' = 'safe';
    let alertMessage = 'Capacity levels optimal';
    
    if (capacityProgress >= 95) {
      alertLevel = 'critical';
      alertMessage = 'Critical: Near maximum capacity';
    } else if (capacityProgress >= 85) {
      alertLevel = 'warning';
      alertMessage = 'Warning: Approaching capacity limit';
    }
    
    return {
      weeklyChange: weeklyChange.toFixed(1),
      isGrowth: weeklyChange > 0,
      peakDay,
      avgDaily: avgDaily.toFixed(1),
      remainingCapacity,
      capacityProgress: capacityProgress.toFixed(1),
      alertLevel,
      alertMessage
    };
  }, [trendData, system.capacity, stats.totalAccepted]);

  const topJHSLeaders = useMemo(() => {
    return students
      .filter(s => s.gwa_grade_10 > 0 && (s.student_category?.toLowerCase().includes("jhs") || s.student_category === "Standard"))
      .sort((a, b) => b.gwa_grade_10 - a.gwa_grade_10)
      .slice(0, 10);
  }, [students]);

  const pieData = useMemo(() => [
    { name: 'ICT Division', value: stats.ictAccepted, color: isDarkMode ? '#60a5fa' : '#2563eb' },
    { name: 'GAS Division', value: stats.gasAccepted, color: isDarkMode ? '#fb923c' : '#f97316' }
  ], [stats.ictAccepted, stats.gasAccepted, isDarkMode]);

  const capacityPercentage = useMemo(() => Math.min((stats.totalAccepted / system.capacity) * 100, 100), [stats.totalAccepted, system.capacity]);

  // Calculated Totals for Archive and Display
  const totalMaleEnrollees = stats.males + stats.pendingMales;
  const totalFemaleEnrollees = stats.females + stats.pendingFemales;
  const grandTotalEnrollees = totalMaleEnrollees + totalFemaleEnrollees;

  const handleCaptureSnapshot = async () => {
    const activeYear = config?.school_year || ""; 
    if (!activeYear) return toast.error("School Year is UNSET.");
    setIsCapturing(true)
    try {
      // Uses TOTAL (Accepted + Pending) for the archive as requested
      const res = await recordYearlySnapshot(activeYear, totalMaleEnrollees, totalFemaleEnrollees)
      if (res.success) { 
        await fetchStudents(true)
        toast.success(`Matrix Upserted: S.Y. ${activeYear}`)
      }
    } catch (error: any) { 
      toast.error("Sync Failed.") 
    } finally { 
      setIsCapturing(false) 
    }
  }

  const confirmDelete = async () => {
    if (!snapshotToDelete) return;
    try {
      const res = await deleteSnapshot(snapshotToDelete.id)
      if (res.success) {
        setHistory(prev => prev.filter(item => item.id !== snapshotToDelete.id))
        toast.success(`Purged Archive: ${snapshotToDelete.year}`)
      }
    } catch (error) { 
      toast.error("Purge Failed.") 
    } finally { 
      setIsDeleteModalOpen(false)
      setSnapshotToDelete(null)
    }
  }

  if (!mounted || loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 text-slate-400">
      <Loader2 className="animate-spin text-blue-600 w-12 h-12" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em]">Calibrating Matrix...</p>
    </div>
  )

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700 pb-20 p-4 md:p-8 transition-colors duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <ThemedText variant="h1" isDarkMode={isDarkMode}>Overview</ThemedText>
               {comparison.status !== 'baseline' && (
                 <Badge className={`px-4 py-1.5 rounded-xl font-black text-[10px] border-none ${comparison.status === 'growth' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'}`}>
                   {comparison.status === 'growth' ? <TrendingUp size={12} className="mr-1 inline"/> : <TrendingDown size={12} className="mr-1 inline"/>}
                   {comparison.percent}% VS Year {comparison.prevYear}
                 </Badge>
               )}
          </div>
          <ThemedText variant="body" muted className="italic text-sm md:text-base" isDarkMode={isDarkMode}>
            Command Center: S.Y. {config?.school_year || "UNSET"}.
          </ThemedText>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <Button onClick={handleCaptureSnapshot} disabled={isCapturing} variant="outline" className="inline-flex items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border py-2 flex-1 md:flex-none h-14 px-6 md:px-8 rounded-2xl font-black text-[10px] uppercase transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 bg-white text-black border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-white dark:border-slate-800 dark:hover:bg-slate-900">
              {isCapturing ? <Loader2 className="animate-spin"/> : <History />} Record Year
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="inline-flex items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border py-2 flex-1 md:flex-none h-14 px-6 md:px-8 rounded-2xl font-black text-[10px] uppercase transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 bg-white text-black border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-white dark:border-slate-800 dark:hover:bg-slate-900">
                   <Activity /> Archives
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl rounded-[48px] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-950">
                <DialogHeader className="p-10 bg-blue-600 dark:bg-slate-900 text-white">
                  <DialogTitle className="text-3xl font-black uppercase">Institutional Archives</DialogTitle>
                  <DialogDescription className="text-slate-300 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Historical Snapshots & Baseline Matrix</DialogDescription>
                </DialogHeader>
                <div className="p-4 md:p-10 bg-white dark:bg-slate-950 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  <Table>
                    <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                      <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 dark:text-slate-500">School Year</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-500 text-center">Males</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-500 text-center">Females</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-500 text-center">Total</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-500 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((record, idx) => (
                        <TableRow key={record.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
                          <TableCell className="py-6 px-6 font-black text-slate-900 dark:text-white uppercase">
                          {record.school_year} {idx === 1 && <span className="inline-flex items-center gap-2 ml-2"><Badge className="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-none text-[8px]">BASELINE</Badge><span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Performance Reference</span></span>}
                          </TableCell>
                          <TableCell className="text-center font-bold text-blue-500 dark:text-blue-400">{record.male_total}</TableCell>
                          <TableCell className="text-center font-bold text-pink-500 dark:text-pink-400">{record.female_total}</TableCell>
                          <TableCell className="text-center font-black text-slate-900 dark:text-white">
                            <div className="flex items-center justify-center gap-2">
                              {record.male_total + record.female_total}
                              {idx + 1 < history.length && (() => {
                                const prev = history[idx + 1].male_total + history[idx + 1].female_total;
                                const curr = record.male_total + record.female_total;
                                if (curr > prev) return <TrendingUp size={14} className="text-emerald-500" />;
                                if (curr < prev) return <TrendingDown size={14} className="text-red-500" />;
                                return <span className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1"><Minus size={12} /> (Constant)</span>;
                              })()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right px-6">
                            <button onClick={() => { setSnapshotToDelete({id: record.id, year: record.school_year}); setIsDeleteModalOpen(true); }} className="p-3 text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-all">
                              <Trash2 size={18} />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </DialogContent>
            </Dialog>

            <Button onClick={() => window.print()} variant="outline" className="inline-flex items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border py-2 flex-1 md:flex-none h-14 px-6 md:px-8 rounded-2xl font-black text-[10px] uppercase transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 bg-white text-black border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-white dark:border-slate-800 dark:hover:bg-slate-900">
               <FileDown /> Print Report
            </Button>
        </div>
      </div>

      {/* FOOTER STATS (Moved to Top) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        <StatCard title="Students Enrolled" value={<AnimatedNumber value={stats.totalAccepted} />} icon={<CheckCircle2 />} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50" trend="Registry Sync" isDarkMode={isDarkMode} />
        <StatCard title="ICT Enrolled" value={<AnimatedNumber value={stats.ictAccepted} />} icon={<Cpu />} color="text-indigo-600 dark:text-indigo-400" bg="bg-indigo-50" trend="Active Matrix" isDarkMode={isDarkMode} />
        <StatCard title="GAS Enrolled" value={<AnimatedNumber value={stats.gasAccepted} />} icon={<BookText />} color="text-orange-600 dark:text-orange-400" bg="bg-orange-50" trend="Active Matrix" isDarkMode={isDarkMode} />
        <StatCard title="Pending Applicants" value={<AnimatedNumber value={stats.pending} />} icon={<Clock />} color="text-amber-600 dark:text-amber-400" bg="bg-amber-50" trend="Live Intake" isDarkMode={isDarkMode} />
      </div>

      {/* CENSUS MATRIX CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <MetricCard 
            label="Male Student Enrolled" 
            value={<AnimatedNumber value={stats.males} />}
            colorLight="linear-gradient(135deg, rgb(59, 130, 246), rgb(37, 99, 235))" 
            colorDark="linear-gradient(135deg, rgb(59, 130, 246), rgb(29, 78, 216))"
            icon={<User size={48}/>}
            isDarkMode={isDarkMode}
          />
          <MetricCard 
            label="Female Student Enrolled" 
            value={<AnimatedNumber value={stats.females} />}
            colorLight="linear-gradient(135deg, rgb(236, 72, 153), rgb(219, 39, 119))" 
            colorDark="linear-gradient(135deg, rgb(244, 114, 182), rgb(236, 72, 153))"
            icon={<UserCircle2 size={48}/>}
            isDarkMode={isDarkMode}
          />
          <MetricCard 
            label="Current Male Enrollee" 
            value={<AnimatedNumber value={stats.pendingMales} />}
            colorLight="linear-gradient(135deg, rgba(30, 64, 175, 0.9), rgba(30, 58, 138, 0.9))" 
            colorDark="linear-gradient(135deg, rgba(30, 58, 138, 0.7), rgba(23, 37, 84, 0.7))"
            icon={<User size={48} className="opacity-70"/>}
            isDarkMode={isDarkMode}
          />
          <MetricCard 
            label="Current Female Enrollee" 
            value={<AnimatedNumber value={stats.pendingFemales} />}
            colorLight="linear-gradient(135deg, rgba(190, 24, 93, 0.9), rgba(157, 23, 77, 0.9))" 
            colorDark="linear-gradient(135deg, rgba(157, 23, 77, 0.7), rgba(131, 24, 67, 0.7))"
            icon={<UserCircle2 size={48} className="opacity-70"/>}
            isDarkMode={isDarkMode}
          />
          <MetricCard 
            label="TOTAL MALE ENROLLEE" 
            value={<AnimatedNumber value={totalMaleEnrollees} />}
            colorLight="linear-gradient(135deg, rgb(30, 58, 138), rgb(15, 23, 42))" 
            colorDark="linear-gradient(135deg, rgb(15, 23, 42), rgb(2, 6, 23))"
            icon={<User size={48} className="text-blue-200 opacity-50"/>}
            isDarkMode={isDarkMode}
          />
          <MetricCard 
            label="TOTAL FEMALE ENROLLEE" 
            value={<AnimatedNumber value={totalFemaleEnrollees} />}
            colorLight="linear-gradient(135deg, rgb(131, 24, 67), rgb(80, 7, 36))" 
            colorDark="linear-gradient(135deg, rgb(80, 7, 36), rgb(60, 5, 25))"
            icon={<UserCircle2 size={48} className="text-pink-200 opacity-50"/>}
            isDarkMode={isDarkMode}
          />
      </div>

      {/* GRAND TOTAL CARD */}
      <div className="w-full">
        <MetricCard 
            label="TOTAL ENROLLEE (MALE + FEMALE)" 
            value={<AnimatedNumber value={grandTotalEnrollees} />}
            colorLight="#ffffff" 
            colorDark="#0f172a"
            textColor={isDarkMode ? "text-white" : "text-slate-900"}
            icon={<Users size={64} className={isDarkMode ? "text-slate-700" : "text-slate-200"}/>}
            isDarkMode={isDarkMode}
          />
      </div>

      {/* 30-DAY VELOCITY */}
      <Card 
        className="p-6 md:p-10 rounded-[32px] md:rounded-[56px] shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden transition-all duration-500"
        style={{
          backgroundColor: isDarkMode ? themeColors.dark.surface : themeColors.light.surface,
          borderColor: isDarkMode ? themeColors.dark.border : 'rgba(168, 85, 247, 0.2)' // Purple border for light mode
        }}
      >
         <div className="flex flex-col sm:flex-row justify-between items-start mb-10 gap-4">
            <div>
               <ThemedText variant="h3" className="flex items-center gap-3 md:text-2xl" isDarkMode={isDarkMode}>
                 <Calendar className="text-blue-600 dark:text-blue-400" /> Enrollment Velocity
               </ThemedText>
               <ThemedText variant="label" className="mt-1" isDarkMode={isDarkMode}>30-Day Registration Analytics</ThemedText>
            </div>
            <Badge className="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-none font-black text-[9px] uppercase px-4 py-2">LIVE DATA FEED</Badge>
         </div>
         <VelocityChart data={trendData} isDarkMode={isDarkMode} />
      </Card>

      {/* ENROLLMENT SPIKE ANALYTICS */}
      <Card 
        className="p-6 md:p-10 rounded-[32px] md:rounded-[56px] shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden transition-all duration-500"
        style={{
          backgroundColor: isDarkMode ? themeColors.dark.surface : themeColors.light.surface,
          borderColor: isDarkMode ? themeColors.dark.border : themeColors.light.border
        }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
          <div>
            <ThemedText variant="h3" className="flex items-center gap-3 md:text-2xl" isDarkMode={isDarkMode}>
              <Zap className="text-amber-600 dark:text-amber-400" /> Enrollment Spike Analytics
            </ThemedText>
            <ThemedText variant="label" className="mt-1" isDarkMode={isDarkMode}>Capacity Monitoring Analytics</ThemedText>
          </div>
          <Badge 
            className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase border-none ${
              spikeAnalysis.alertLevel === 'critical' 
                ? 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400' 
                : spikeAnalysis.alertLevel === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {spikeAnalysis.alertMessage}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div 
            className="p-6 rounded-3xl border transition-all duration-300"
            style={{
              backgroundColor: isDarkMode ? 'rgb(30, 41, 59)' : 'rgb(241, 245, 249)',
              borderColor: isDarkMode ? 'rgb(51, 65, 85)' : 'rgb(226, 232, 240)'
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              {spikeAnalysis.isGrowth ? (
                <TrendingUp size={16} className="text-emerald-500 dark:text-emerald-400" />
              ) : (
                <TrendingDown size={16} className="text-red-500 dark:text-red-400" />
              )}
              <ThemedText variant="label" isDarkMode={isDarkMode}>Weekly Trend</ThemedText>
            </div>
            <div className="flex items-baseline gap-2">
              <ThemedText variant="h2" className="text-2xl md:text-3xl" isDarkMode={isDarkMode}>
                {spikeAnalysis.isGrowth ? '+' : ''}{spikeAnalysis.weeklyChange}%
              </ThemedText>
            </div>
          </div>

          <div 
            className="p-6 rounded-3xl border transition-all duration-300"
            style={{
              backgroundColor: isDarkMode ? 'rgb(30, 41, 59)' : 'rgb(241, 245, 249)',
              borderColor: isDarkMode ? 'rgb(51, 65, 85)' : 'rgb(226, 232, 240)'
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Target size={16} className="text-blue-600 dark:text-blue-400" />
              <ThemedText variant="label" isDarkMode={isDarkMode}>Avg Daily Intake</ThemedText>
            </div>
            <ThemedText variant="h2" className="text-2xl md:text-3xl" isDarkMode={isDarkMode}>
              {spikeAnalysis.avgDaily}
            </ThemedText>
          </div>

          <div 
            className="p-6 rounded-3xl border transition-all duration-300"
            style={{
              backgroundColor: isDarkMode ? 'rgb(30, 41, 59)' : 'rgb(241, 245, 249)',
              borderColor: isDarkMode ? 'rgb(51, 65, 85)' : 'rgb(226, 232, 240)'
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Activity size={16} className="text-purple-600 dark:text-purple-400" />
              <ThemedText variant="label" isDarkMode={isDarkMode}>Peak Day</ThemedText>
            </div>
            <ThemedText variant="h2" className="text-xl md:text-2xl" isDarkMode={isDarkMode}>
              <AnimatedNumber value={spikeAnalysis.peakDay.count} />
            </ThemedText>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-1">
              {spikeAnalysis.peakDay.date}
            </p>
          </div>

          <div 
            className="p-6 rounded-3xl border transition-all duration-300"
            style={{
              backgroundColor: isDarkMode ? 'rgb(30, 41, 59)' : 'rgb(241, 245, 249)',
              borderColor: isDarkMode ? 'rgb(51, 65, 85)' : 'rgb(226, 232, 240)'
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} className="text-orange-600 dark:text-orange-400" />
              <ThemedText variant="label" isDarkMode={isDarkMode}>Slots Remaining</ThemedText>
            </div>
            <ThemedText variant="h2" className="text-2xl md:text-3xl" isDarkMode={isDarkMode}>
              <AnimatedNumber value={spikeAnalysis.remainingCapacity} />
            </ThemedText>
          </div>
        </div>

        {/* Capacity Progress Bar */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <ThemedText variant="label" isDarkMode={isDarkMode}>Capacity Utilization</ThemedText>
            <span className={`text-xl font-black ${
              spikeAnalysis.alertLevel === 'critical' 
                ? 'text-red-600 dark:text-red-400' 
                : spikeAnalysis.alertLevel === 'warning'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {spikeAnalysis.capacityProgress}%
            </span>
          </div>
          <div 
            className="h-6 w-full rounded-3xl overflow-hidden p-1.5 shadow-inner"
            style={{ backgroundColor: isDarkMode ? 'rgb(30 41 59)' : 'rgb(226 232 240)' }}
          >
            <div 
              className={`h-full rounded-2xl transition-all duration-1000 ease-out ${
                spikeAnalysis.alertLevel === 'critical' 
                  ? 'bg-red-500' 
                  : spikeAnalysis.alertLevel === 'warning'
                  ? 'bg-amber-500 dark:bg-amber-400'
                  : 'bg-emerald-500 dark:bg-emerald-400'
              }`}
              style={{ 
                width: `${spikeAnalysis.capacityProgress}%`,
                boxShadow: spikeAnalysis.alertLevel === 'critical' 
                  ? '0 0 20px rgba(239, 68, 68, 0.5)' 
                  : spikeAnalysis.alertLevel === 'warning'
                  ? '0 0 20px rgba(245, 158, 11, 0.5)'
                  : '0 0 20px rgba(34, 197, 94, 0.5)'
              }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            <span><AnimatedNumber value={stats.totalAccepted} /> Enrolled</span>
            <span>{system.capacity} Max Capacity</span>
          </div>
        </div>
      </Card>

      {/* REVENUE MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <Card 
            className="lg:col-span-2 p-6 md:p-12 rounded-[32px] md:rounded-[56px] shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group transition-all duration-500"
            style={{
              backgroundColor: isDarkMode ? themeColors.dark.surface : 'rgba(240, 253, 244, 0.5)',
              borderColor: isDarkMode ? themeColors.dark.border : 'rgba(187, 247, 208, 0.5)'
            }}
          >
             <div className="absolute top-0 right-0 p-10 opacity-5 md:opacity-10 group-hover:opacity-20 transition-opacity">
               <Banknote size={120} className="text-emerald-600 dark:text-emerald-400" />
             </div>
             <div className="relative z-10 space-y-10">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                   <div>
                      <ThemedText variant="h3" className="flex items-center gap-3 md:text-2xl" isDarkMode={isDarkMode}>
                        <Landmark className="text-emerald-500 dark:text-emerald-400" /> Revenue Matrix
                      </ThemedText>
                      <ThemedText variant="label" className="mt-1" isDarkMode={isDarkMode}>Registrar Monitoring (₱{revenueMatrix.voucherLabel.toLocaleString()} / Alumni)</ThemedText>
                   </div>
                   <div className="text-left sm:text-right">
                      <p className="text-3xl md:text-5xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">₱{revenueMatrix.currentRevenue.toLocaleString()}</p>
                      <ThemedText variant="label" className="mt-1" isDarkMode={isDarkMode}>Total Active Funding</ThemedText>
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      <span>Liquidity Progress</span>
                      <span className="hidden sm:inline">Target: ₱{(revenueMatrix.totalPotential / 1000000).toFixed(1)}M (Campus Cap)</span>
                   </div>
                   <div className="h-5 w-full rounded-2xl overflow-hidden p-1 shadow-inner border border-emerald-100 dark:border-none" style={{ backgroundColor: isDarkMode ? 'rgb(30 41 59)' : 'rgb(226 232 240)' }}>
                      <div 
                        className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-xl transition-all duration-1000" 
                        style={{ 
                          width: `${revenueMatrix.fundingProgress}%`,
                          boxShadow: isDarkMode ? '0 0 20px rgba(52, 211, 153, 0.3)' : '0 0 20px rgba(16, 185, 129, 0.3)'
                        }} 
                      />
                   </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-10 pt-4 border-t border-slate-50 dark:border-slate-800">
                   <div className="space-y-2">
                      <ThemedText variant="label" isDarkMode={isDarkMode}>ICT Revenue contribution</ThemedText>
                      <ThemedText variant="h3" className="md:text-2xl" isDarkMode={isDarkMode}>₱{(revenueMatrix.qualifiedICT * revenueMatrix.voucherLabel).toLocaleString()}</ThemedText>
                   </div>
                   <div className="space-y-2 sm:text-right">
                      <ThemedText variant="label" isDarkMode={isDarkMode}>GAS Revenue contribution</ThemedText>
                      <ThemedText variant="h3" className="md:text-2xl" isDarkMode={isDarkMode}>₱{(revenueMatrix.qualifiedGAS * revenueMatrix.voucherLabel).toLocaleString()}</ThemedText>
                   </div>
                </div>
             </div>
          </Card>

          <Card 
            className="p-6 md:p-10 rounded-[32px] md:rounded-[56px] relative overflow-hidden flex flex-col justify-between min-h-[300px] shadow-2xl shadow-blue-100 dark:shadow-none transition-all duration-500"
            style={{
              background: isDarkMode ? themeColors.dark.surface : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              borderColor: isDarkMode ? themeColors.dark.border : 'transparent'
            }}
          >
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mr-10 -mt-10" />
             <div className="relative z-10 space-y-8">
                <h3 className={`text-lg font-black uppercase tracking-widest flex items-center gap-2 ${isDarkMode ? 'text-blue-300' : 'text-white'}`}>
                  <Timer size={20} className={isDarkMode ? "text-blue-400" : "text-white"} /> Saturation Forecast
                </h3>
                <div>
                   <p className={`text-5xl md:text-7xl font-black tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-white'}`}>
                     <AnimatedNumber value={prediction.days} /> 
                   </p>
                   <p className={`text-xs md:text-sm font-black uppercase tracking-widest mt-4 italic ${isDarkMode ? 'text-slate-500' : 'text-blue-100'}`}>
                     Days to 100% based on {prediction.speed} intakes/day.
                   </p>
                </div>
             </div>
             <div className={`relative z-10 p-4 md:p-6 rounded-3xl border mt-6 ${isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-white/10 border-white/20'}`}>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-100'}`}>Baseline comparison</p>
                <p className={`text-xs font-medium leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-white'}`}>System is performing at {comparison.percent}% efficiency vs {comparison.prevYear || 'baseline'}.</p>
             </div>
          </Card>
      </div>

      {/* CAPACITY STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
        <div className="lg:col-span-2 space-y-10">
          <Card 
            className="p-6 md:p-12 rounded-[32px] md:rounded-[56px] shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group transition-all duration-500"
            style={{
              backgroundColor: isDarkMode ? themeColors.dark.surface : themeColors.light.surface,
              borderColor: isDarkMode ? themeColors.dark.border : themeColors.light.border
            }}
          >
            <div className="relative z-10 space-y-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div className="space-y-2">
                  <ThemedText variant="label" className="tracking-[0.4em]" isDarkMode={isDarkMode}>Campus Capacity Status</ThemedText>
                  <ThemedText variant="h2" className="text-3xl md:text-5xl leading-none" isDarkMode={isDarkMode}>Saturation: {capacityPercentage.toFixed(1)}%</ThemedText>
                </div>
                <Badge className={`px-4 py-2 rounded-full font-black text-[10px] uppercase shadow-lg border-none ${capacityPercentage > 90 ? 'bg-red-500 text-white' : 'bg-blue-600 dark:bg-blue-500 text-white'}`}>
                  {capacityPercentage > 90 ? 'Critical' : 'Operational'}
                </Badge>
              </div>
              <div className="space-y-6">
                <div className="h-6 w-full rounded-3xl overflow-hidden p-1.5 shadow-inner" style={{ backgroundColor: isDarkMode ? 'rgb(30 41 59)' : 'rgb(226 232 240)' }}>
                  <div 
                    className={`h-full transition-all duration-1000 ease-out rounded-2xl ${capacityPercentage > 90 ? 'bg-red-500' : capacityPercentage > 75 ? 'bg-orange-500 dark:bg-orange-400' : 'bg-blue-600 dark:bg-blue-500'}`} 
                    style={{ width: `${capacityPercentage}%` }} 
                  />
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1">
                   <span><AnimatedNumber value={stats.totalAccepted} /> Students Handled</span>
                   <span>Capacity: {system.capacity}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card 
            className="rounded-[32px] md:rounded-[56px] shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden transition-all duration-500 border-2"
            style={{
              backgroundColor: isDarkMode ? themeColors.dark.surface : themeColors.light.surface,
              borderColor: isDarkMode ? themeColors.dark.border : themeColors.light.border
            }}
          >
             <div 
              className="p-6 md:p-10 border-b-2 dark:bg-slate-800/30 flex justify-between items-center"
              style={{ 
                borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#939393',
                backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.3)' : 'rgba(251, 255, 0, 0.19)'
                }}
             >
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-yellow-500 dark:bg-yellow-600 rounded-2xl text-white shadow-lg">
                     <Trophy size={20} />
                   </div>
                   <div>
                     <ThemedText variant="h3" className="text-lg md:text-xl" isDarkMode={isDarkMode}>Academic Leaders</ThemedText>
                     <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isDarkMode ? 'text-slate-400' : 'text-black'}`}>JHS Excellence Board</p>
                   </div>
                </div>
                <Badge className="bg-slate-900 dark:bg-slate-700 text-white border-none font-black text-[9px] uppercase px-4 py-2">Top 10</Badge>
             </div>
             <div className="overflow-x-auto">
              <Table className="border-separate border-spacing-y-4 px-4 md:px-6">
                  <TableBody>
                    {topJHSLeaders.map((s, idx) => (
                        <TableRow key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group relative">
                          <TableCell className="px-4 md:px-10 py-4 md:py-6 min-w-[200px] relative">
                              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${s.gender === 'Male' ? 'bg-blue-500 dark:bg-blue-400' : 'bg-pink-500 dark:bg-pink-400'}`} />
                              <div className="flex items-center gap-3 md:gap-5 pl-2">
                              <span className="text-xs font-black text-slate-400 dark:text-slate-500 w-auto">
                                #{idx + 1} {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''}
                              </span>
                                <div>
                                    <ThemedText variant="caption" className="text-slate-900 dark:text-white text-xs" isDarkMode={isDarkMode}>{s.last_name}, {s.first_name}</ThemedText>
                                    <ThemedText variant="label" isDarkMode={isDarkMode}>{s.strand} Section </ThemedText>
                                </div>
                              </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-[10px] px-3 md:px-5 py-1.5 rounded-full">
                              {s.gwa_grade_10} GWA
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right px-4 md:px-10">
                            <Link href="/admin/sections">
                              <button className="p-2 text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                <ChevronRight size={18}/>
                              </button>
                            </Link>
                          </TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
              </Table>
             </div>
          </Card>
        </div>

        <Card 
          className="rounded-[32px] md:rounded-[56px] shadow-2xl shadow-slate-200/50 dark:shadow-none p-6 md:p-10 relative overflow-hidden flex flex-col justify-between transition-all duration-500"
          style={{
            backgroundColor: isDarkMode ? themeColors.dark.surface : themeColors.light.surface,
            borderColor: isDarkMode ? themeColors.dark.border : themeColors.light.border
          }}
        >
           <div>
              <div className="flex items-center gap-3 mb-8">
                 <div className="p-2.5 bg-blue-600 dark:bg-blue-500 rounded-2xl text-white shadow-lg">
                   <PieIcon size={20} />
                 </div>
                 <div>
                   <ThemedText variant="h3" className="text-lg" isDarkMode={isDarkMode}>Strand Ratio</ThemedText>
                   <ThemedText variant="label" className="mt-1" isDarkMode={isDarkMode}>Strand Share</ThemedText>
                 </div>
              </div>
              <StrandPieChart data={pieData} total={stats.totalAccepted} isDarkMode={isDarkMode} />
           </div>
           <div className="space-y-4 mt-8 px-2">
              {pieData.map((item) => (
                 <div 
                   key={item.name} 
                   className="flex justify-between items-center p-4 md:p-5 rounded-3xl border group transition-all cursor-default"
                   style={{
                     backgroundColor: isDarkMode ? 'rgb(30, 41, 59)' : 'rgb(241, 245, 249)',
                     borderColor: isDarkMode ? 'rgb(51, 65, 85)' : 'rgb(226, 232, 240)'
                   }}
                 >
                    <div className="flex items-center gap-4">
                       <div className="h-3 w-3 rounded-full shadow-lg" style={{ backgroundColor: item.color }} />
                       <span className={`text-[10px] font-black uppercase tracking-widest group-hover:text-blue-600 dark:group-hover:text-white ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                         {item.name}
                       </span>
                    </div>
                    <ThemedText variant="h3" className={`text-lg group-hover:text-blue-600 dark:group-hover:text-blue-300 ${isDarkMode ? 'text-white' : 'text-slate-900'}`} isDarkMode={isDarkMode}>
                      <AnimatedNumber value={item.value} />
                    </ThemedText>
                 </div>
              ))}
           </div>
        </Card>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md rounded-[32px] md:rounded-[40px] p-6 md:p-10 border-none shadow-2xl bg-white dark:bg-slate-950">
          <DialogHeader className="sr-only">
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>Confirm deletion of yearly snapshot</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 md:w-20 h-16 md:h-20 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center animate-bounce">
              <AlertTriangle size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Confirm Purge</h3>
              <p className="text-slate-700 dark:text-slate-400 text-sm font-medium">
                Permanently delete matrix for <span className="font-black text-slate-900 dark:text-white uppercase">S.Y. {snapshotToDelete?.year}</span>?
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <Button 
                onClick={() => setIsDeleteModalOpen(false)} 
                variant="outline" 
                className="flex-1 h-14 rounded-2xl font-black text-[10px] uppercase border-slate-300 bg-slate-50 text-slate-700 dark:bg-transparent dark:border-slate-800 dark:text-slate-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmDelete} 
                className="flex-1 h-14 rounded-2xl bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white font-black text-[10px] uppercase shadow-lg shadow-red-100 dark:shadow-none"
              >
                Purge Record
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}