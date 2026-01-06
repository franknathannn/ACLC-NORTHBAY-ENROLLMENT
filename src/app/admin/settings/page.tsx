"use client"

import { useEffect, useState, useCallback, useMemo, memo } from "react"
import { supabase } from "@/lib/supabase/client"
import { 
  toggleEnrollment, 
  forceSyncCapacities,
  updateCapacity 
} from "@/lib/actions/settings"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Loader2, DatabaseZap, Users, Save, AlertCircle,
  CalendarDays, Globe, Settings2, Cpu, Eraser, ShieldAlert,
  Banknote, Landmark, Zap
} from "lucide-react"
import { toast } from "sonner"
import { ThemedCard } from "@/components/ThemedCard"
import { ThemedText } from "@/components/ThemedText"
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

export default function SettingsPage() {
  const { isDarkMode: themeDarkMode } = useTheme()
  const [isDarkMode, setIsDarkMode] = useState(themeDarkMode)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [currentAccepted, setCurrentAccepted] = useState(0)

  // capacity and voucherValue are string | number to handle blank states
  const [config, setConfig] = useState({
    id: "",
    isOpen: true,
    capacity: 1000 as string | number,
    schoolYear: "",
    startDate: "",
    endDate: "",
    controlMode: "automatic",
    voucherValue: 22500 as string | number
  })

  const loadSettings = useCallback(async () => {
    try {
      const { data: configData } = await supabase.from('system_config').select('*').single()
      
      const { count } = await supabase.from('students')
        .select('*', { count: 'exact', head: true })
        .or('status.eq.Accepted,status.eq.Approved')
      
      if (configData) {
        setConfig({
          id: configData.id,
          isOpen: configData.is_portal_active,
          capacity: configData.capacity ?? 1000,
          schoolYear: configData.school_year || "",
          startDate: configData.enrollment_start || "",
          endDate: configData.enrollment_end || "",
          controlMode: configData.control_mode || "automatic",
          voucherValue: configData.voucher_value ?? 22500
        })
        setCurrentAccepted(count || 0)
      }
    } catch (err) {
      console.error("Fetch Error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadSettings() }, [loadSettings])

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

  // --- LOGIC A: System Mode Toggle (STRICTLY RETAINED) ---
  const handleModeToggle = async (isManual: boolean) => {
    setUpdating(true)
    // ⚡ Optimistic Update
    const prevMode = config.controlMode;
    setConfig(prev => ({ ...prev, controlMode: isManual ? 'manual' : 'automatic' }));

    const newMode = isManual ? 'manual' : 'automatic'
    try {
      let finalPortalStatus = config.isOpen
      if (newMode === 'automatic') {
        if (!config.startDate || !config.endDate) {
          finalPortalStatus = false
          toast.info("Automatic Mode requires dates. Portal auto-locked.")
        } else {
          const now = new Date()
          const start = new Date(config.startDate)
          const end = new Date(config.endDate)
          now.setHours(0,0,0,0)
          start.setHours(0,0,0,0)
          end.setHours(23,59,59,999)
          finalPortalStatus = now >= start && now <= end
        }
      }
      const { error } = await supabase.from('system_config')
        .update({ 
          control_mode: newMode,
          is_portal_active: finalPortalStatus 
        })
        .eq('id', config.id)
      if (error) throw error
      // Confirm final state
      setConfig(prev => ({ ...prev, isOpen: finalPortalStatus }))
      toast.success(`System logic synchronized to ${newMode.toUpperCase()}`)
    } catch (err) {
      setConfig(prev => ({ ...prev, controlMode: prevMode })); // Revert
      toast.error("Protocol Sync Failed.")
    } finally {
      setUpdating(false)
    }
  }

  // --- LOGIC B: Manual Override (STRICTLY RETAINED) ---
  const handleManualOverride = async (checked: boolean) => {
    setUpdating(true)
    // ⚡ Optimistic Update
    const prevOpen = config.isOpen;
    setConfig(prev => ({ ...prev, isOpen: checked }));

    try {
      await toggleEnrollment(checked)
      toast.success(`Override: Portal ${checked ? 'OPEN' : 'CLOSED'}`)
    } catch (err) {
      setConfig(prev => ({ ...prev, isOpen: prevOpen })); // Revert
      toast.error("Manual Override Command Failed.")
    } finally {
      setUpdating(false)
    }
  }

  // --- LOGIC C: Capacity Guardian (STRICTLY RETAINED) ---
  const runCapacityGuardian = async () => {
    setUpdating(true)
    try {
      const currentCap = Number(config.capacity)
      if (currentAccepted >= currentCap) {
        const { error } = await supabase.from('system_config').update({ 
          is_portal_active: false,
          control_mode: 'manual' 
        }).eq('id', config.id)
        if (error) throw error
        setConfig(prev => ({ ...prev, isOpen: false, controlMode: 'manual' }))
        toast.warning("Guardian Critical: Limit reached. Portal shutdown complete.")
      } else {
        toast.info(`Integrity verified. ${currentCap - currentAccepted} slots available.`)
      }
    } catch (err) {
      toast.error("Guardian Execution Failed.")
    } finally {
      setUpdating(false)
    }
  }

  // --- GLOBAL SAVE: ENFORCING PROTOCOLS ---
  const handleGlobalSave = async () => {
    // CAPACITY BLANK CHECK
    if (config.capacity === "" || config.capacity === null) {
      return toast.error("Validation Error: Capacity field cannot be blank.")
    }

    // VOUCHER BLANK CHECK (UPDATED REQUEST)
    if (config.voucherValue === "" || config.voucherValue === null) {
      return toast.error("Financial Error: Voucher Value cannot be blank.")
    }
    
    const numericCapacity = Number(config.capacity)
    const numericVoucher = Number(config.voucherValue)

    if (numericCapacity < 50) {
      return toast.error("System Protocol: Minimum capacity is 50.")
    }

    setIsSaving(true)
    try {
      let calculatedStatus = config.isOpen
      if (config.controlMode === 'automatic') {
        if (!config.startDate || !config.endDate) {
          calculatedStatus = false
        } else {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const start = new Date(config.startDate)
          const end = new Date(config.endDate)
          end.setHours(23, 59, 59, 999)
          calculatedStatus = today >= start && today <= end
        }
      }

      const payload: any = {
        school_year: config.schoolYear,
        enrollment_start: config.startDate || null,
        enrollment_end: config.endDate || null,
        capacity: numericCapacity,
        voucher_value: numericVoucher,
        is_portal_active: calculatedStatus
      }

      const { error } = await supabase.from('system_config')
        .update(payload)
        .eq('id', config.id)

      if (error) throw error
      
      await updateCapacity(numericCapacity)
      setConfig(prev => ({ ...prev, isOpen: calculatedStatus }))
      toast.success("Configuration Committed Successfully")
    } catch (err: any) {
      console.error(err)
      toast.error("Schema Mismatch. Please refresh browser and try again.")
    } finally {
      setIsSaving(false)
    }
  }

  // --- REACTIVE SATURATION ENGINE ---
  const capacityPercentage = useMemo(() => {
    const cap = Number(config.capacity)
    if (!cap || cap <= 0) return 0
    return Math.min((currentAccepted / cap) * 100, 100)
  }, [currentAccepted, config.capacity])

  return (
    <div className="relative min-h-screen transition-colors duration-500">
      <StarConstellation />
      <div className="relative z-10 max-w-4xl mx-auto p-4 md:p-8 space-y-12 animate-in fade-in duration-700 pb-32">
      
      <div className="text-center space-y-4">
        <div className="inline-flex p-6 bg-slate-900 text-white rounded-[32px] mb-2 shadow-2xl"><Settings2 size={40} /></div>
        <ThemedText variant="h1" className="text-4xl font-bold tracking-tight" isDarkMode={isDarkMode}>Configuration</ThemedText>
        <ThemedText variant="body" className="italic text-sm" isDarkMode={isDarkMode}>AMA ACLC Northbay Enrollment Customization</ThemedText>
      </div>

      <div className="space-y-6">
        {/* SYSTEM LOGIC MODE */}
        <ThemedCard 
          className={`p-8 rounded-[40px] flex items-center justify-between group transition-all duration-500 ${config.controlMode === 'manual' ? 'border border-purple-500' : 'border border-blue-400'}`}
          style={{
            backgroundColor: isDarkMode ? themeColors.dark.surface : '#ffffff',
            borderColor: config.controlMode === 'manual' ? undefined : (isDarkMode ? themeColors.dark.border : 'rgb(96 165 250)')
          }}
        >
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl transition-all duration-500 ${config.controlMode === 'automatic' ? 'bg-blue-400 text-white' : 'bg-purple-600 text-white'}`}><Cpu size={24} /></div>
            <div>
              <ThemedText variant="h3" className="font-bold uppercase tracking-wide" style={{ fontSize: '14px', lineHeight: '20px' }} isDarkMode={isDarkMode}>System Logic Mode</ThemedText>
              <ThemedText variant="caption" className="italic font-medium text-[10px]" isDarkMode={isDarkMode}>{config.controlMode === 'automatic' ? 'Schedule Automation' : 'Administrative Override'}</ThemedText>
            </div>
          </div>
          <Switch checked={config.controlMode === 'manual'} onCheckedChange={handleModeToggle} disabled={updating} className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-slate-400 dark:data-[state=unchecked]:bg-slate-600 shadow-sm border border-slate-200 dark:border-slate-700" />
        </ThemedCard>

        {/* MANUAL OVERRIDE */}
        <ThemedCard 
          className={`p-8 rounded-[40px] flex items-center justify-between transition-all duration-500 border ${config.controlMode !== 'manual' ? 'opacity-30 grayscale pointer-events-none' : (config.isOpen ? 'opacity-100 border border-green-400' : 'opacity-100 border border-green-200')}`}
          style={{
            backgroundColor: isDarkMode ? themeColors.dark.surface : '#ffffff',
            borderColor: (config.controlMode === 'manual' && config.isOpen) ? undefined : (isDarkMode ? themeColors.dark.border : 'rgb(226 232 240)')
          }}
        >
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${config.isOpen ? 'bg-green-500 text-white' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}><Globe size={24} /></div>
            <div>
              <ThemedText variant="h3" className="font-bold uppercase tracking-wide" style={{ fontSize: '14px', lineHeight: '20px' }} isDarkMode={isDarkMode}>Manual Portal Override</ThemedText>
              <ThemedText variant="caption" className="italic font-medium text-[10px]" isDarkMode={isDarkMode}>Forced Bypass Control</ThemedText>
            </div>
          </div>
          <Switch checked={config.isOpen} onCheckedChange={handleManualOverride} disabled={updating} className="data-[state=checked]:bg-green-500 shadow-sm border border-slate-200 dark:border-slate-700" />
        </ThemedCard>

        {/* ENROLLMENT MATRIX */}
        <ThemedCard 
          className={`p-10 rounded-[48px] space-y-8 transition-all duration-500 border ${config.controlMode !== 'automatic' ? 'opacity-60 border-blue-900 pointer-events-none' : 'opacity-100 border-blue-400'}`}
          style={{
            backgroundColor: isDarkMode ? themeColors.dark.surface : '#ffffff',
            borderColor: config.controlMode === 'automatic' ? 'rgb(96 165 250)' : (isDarkMode ? 'rgb(30 58 138)' : 'rgb(191 219 254)')
          }}
        >
          <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-6">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-blue-500 text-white rounded-xl"><CalendarDays size={20} /></div>
               <ThemedText variant="h3" className="text-xs font-bold uppercase tracking-wide" isDarkMode={isDarkMode}>Enrollment Matrix</ThemedText>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setConfig({...config, schoolYear: "", startDate: "", endDate: ""})} className="text-[9px] font-bold uppercase text-slate-400 hover:text-red-600 transition-colors"><Eraser size={14} className="mr-2"/> Clear Fields</Button>
          </div>

          <div className="space-y-6">
             <div className="space-y-2">
               <ThemedText variant="label" className="text-[10px] font-bold uppercase tracking-wide" isDarkMode={isDarkMode}>Target School Year</ThemedText>
               <Input 
                 value={config.schoolYear} 
                 onChange={(e) => setConfig({...config, schoolYear: e.target.value})} 
                 className="h-14 rounded-2xl border-slate-200 dark:border-slate-800 font-bold text-base uppercase focus-visible:ring-blue-500 transition-all duration-500" 
                 placeholder="2025-2026" 
                 style={{ backgroundColor: isDarkMode ? 'rgb(30 41 59)' : 'rgb(241 245 249)', color: isDarkMode ? '#ffffff' : '#000000' }}
               />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <ThemedText variant="label" className="text-[10px] font-bold uppercase tracking-wide" isDarkMode={isDarkMode}>Enrollment Launch</ThemedText>
                  <Input 
                    type="date" 
                    value={config.startDate} 
                    onChange={(e) => setConfig({...config, startDate: e.target.value})} 
                    className="h-12 rounded-xl border-none font-bold text-xs transition-all duration-500" 
                    style={{ backgroundColor: isDarkMode ? 'rgb(30 41 59)' : 'rgb(241 245 249)', color: isDarkMode ? '#ffffff' : '#000000' }}
                  />
                </div>
                <div className="space-y-2">
                  <ThemedText variant="label" className="text-[10px] font-bold uppercase tracking-wide" isDarkMode={isDarkMode}>Enrollment Expiration</ThemedText>
                  <Input 
                    type="date" 
                    value={config.endDate} 
                    onChange={(e) => setConfig({...config, endDate: e.target.value})} 
                    className="h-12 rounded-xl border-none font-bold text-xs transition-all duration-500" 
                    style={{ backgroundColor: isDarkMode ? 'rgb(30 41 59)' : 'rgb(241 245 249)', color: isDarkMode ? '#ffffff' : '#000000' }}
                  />
                </div>
             </div>
          </div>
        </ThemedCard>

        {/* CAPACITY GUARDIAN */}
        <ThemedCard 
          className="p-10 rounded-[48px] space-y-8 border transition-all duration-500"
          style={{
            backgroundColor: isDarkMode ? themeColors.dark.surface : '#ffffff',
            borderColor: isDarkMode ? themeColors.dark.border : 'rgb(226 232 240)'
          }}
        >
          <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ backgroundColor: '#9333ea', color: 'white' }}><Users size={20} /></div>
              <ThemedText variant="h3" className="text-xs font-bold uppercase tracking-wide" isDarkMode={isDarkMode}>School Student Capacity</ThemedText>
            </div>
            <Button onClick={runCapacityGuardian} disabled={updating} variant="outline" className="rounded-full text-[9px] font-bold uppercase border-red-100 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 shadow-sm transition-all active:scale-95">
                <ShieldAlert size={14} className="mr-2" /> Integrity Scan
            </Button>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <ThemedText variant="label" className="text-[10px] font-bold uppercase tracking-wide" isDarkMode={isDarkMode}>Educational Capacity (MORE THAN 50)</ThemedText>
              {/* REACTIVE BLANK INPUT LOGIC */}
              <Input 
                type="text" 
                value={config.capacity === 0 || config.capacity === null ? "" : config.capacity} 
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || val === " ") {
                    setConfig({...config, capacity: ""});
                  } else {
                    const parsed = parseInt(val);
                    if (!isNaN(parsed)) setConfig({...config, capacity: parsed});
                  }
                }} 
                 className="h-16 rounded-3xl border-none font-bold text-2xl px-8 focus-visible:ring-indigo-500 shadow-inner transition-all duration-500" 
                placeholder="50+"
                style={{ backgroundColor: isDarkMode ? 'rgb(30 41 59)' : 'rgb(241 245 249)', color: isDarkMode ? '#ffffff' : '#000000' }}
              />
            </div>

            <div className="w-full bg-blue-600 dark:bg-slate-900 p-8 rounded-[36px] text-white relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mr-10 -mt-10" />
               <div className="flex justify-between items-end mb-4 relative z-10">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-blue-400 tracking-wide">Current Capacity</span>
                    <p className="text-2xl font-bold mt-1">{currentAccepted} <span className="text-slate-500 text-sm">/ {config.capacity || "—"} Seats</span></p>
                  </div>
                  <span className="text-xl font-bold text-white">{Math.round(capacityPercentage)}%</span>
               </div>
               <div className="h-3 bg-white/10 rounded-full overflow-hidden shadow-inner relative z-10">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out ${
                      capacityPercentage > 95 ? 'bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 
                      capacityPercentage > 80 ? 'bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5)]' : 
                      'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                    }`} 
                    style={{ width: `${capacityPercentage}%` }} 
                  />
               </div>
            </div>
          </div>
        </ThemedCard>

        {/* FINANCIAL HUB (UPGRADED BLANK INPUT LOGIC) */}
        <ThemedCard 
          className="p-10 rounded-[48px] space-y-8 border transition-all duration-500"
          style={{
            backgroundColor: isDarkMode ? themeColors.dark.surface : '#ffffff',
            borderColor: isDarkMode ? themeColors.dark.border : 'rgb(226 232 240)'
          }}
        >
           <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-6">
              <div className="p-2 rounded-xl" style={{ backgroundColor: '#16a34a', color: 'white' }}><Banknote size={20} /></div>
              <ThemedText variant="h3" className="text-xs font-bold uppercase tracking-wide" isDarkMode={isDarkMode}>Financial Estimator</ThemedText>
           </div>
           <div className="space-y-6">
              <div className="space-y-2">
                <ThemedText variant="label" className="text-[10px] font-bold uppercase tracking-wide" isDarkMode={isDarkMode}>Global Voucher Value (PHP)</ThemedText>
                <div className="relative">
                  <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  {/* UPDATED: Handles blank state properly if deleted */}
                  <Input 
                    type="text" 
                    value={config.voucherValue === 0 || config.voucherValue === null ? "" : config.voucherValue} 
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || val === " ") {
                        setConfig({...config, voucherValue: ""});
                      } else {
                        const parsed = parseInt(val);
                        if (!isNaN(parsed)) setConfig({...config, voucherValue: parsed});
                      }
                    }}
                    className="h-14 rounded-2xl border-none font-bold text-lg pl-12 focus-visible:ring-emerald-500 transition-all duration-500" 
                    style={{ backgroundColor: isDarkMode ? 'rgb(30 41 59)' : 'rgb(241 245 249)', color: isDarkMode ? '#ffffff' : '#000000' }}
                  />
                </div>
                <p className="text-[9px] text-slate-400 font-medium italic mt-2 px-2">Used for real-time revenue matrix calculations on the Dashboard.</p>
              </div>
           </div>
        </ThemedCard>

        <div className="pt-6 space-y-4">
          <Button onClick={handleGlobalSave} disabled={isSaving} className="w-full h-20 rounded-[32px] bg-blue-600 dark:bg-slate-900 hover:bg-blue-700 dark:hover:bg-black text-white font-bold uppercase tracking-widest text-xs shadow-2xl transition-all hover:-translate-y-1 active:scale-95 shadow-blue-500/20">
            {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={20} />} Commit Protocol Configuration
          </Button>

          <div className="flex justify-center">
              <Button onClick={async () => { setIsSyncing(true); await forceSyncCapacities(); setIsSyncing(false); toast.success("Recalibrated Successfully."); }} disabled={isSyncing} variant="ghost" className="text-slate-400 hover:text-amber-600 text-[10px] font-bold uppercase tracking-widest group">
                  <Zap size={14} className="mr-2 group-hover:fill-amber-600 transition-all" /> {isSyncing ? "Calibrating..." : "Force Sync Capacities"}
              </Button>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}