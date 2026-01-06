"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { updateCapacity } from "@/lib/actions/settings" 
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { 
  Settings2, 
  Clock, 
  ShieldCheck, 
  Save, 
  Loader2, 
  Globe,
  Lock,
  CalendarDays,
  AlertTriangle,
  Database,
  Hand,
  Zap
} from "lucide-react"
import { toast } from "sonner"

export default function ConfigurationPage() {
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [config, setConfig] = useState({
    id: "",
    enrollment_start: "",
    enrollment_end: "",
    school_year: "",
    is_portal_active: true,
    capacity: 1000,
    control_mode: "automatic" // 'automatic' | 'manual'
  })

  const fetchConfig = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('system_config')
      .select('*')
      .single()

    if (data) setConfig(data)
    setLoading(false)
  }

  useEffect(() => { fetchConfig() }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('system_config')
        .update({
          enrollment_start: config.enrollment_start,
          enrollment_end: config.enrollment_end,
          school_year: config.school_year,
          is_portal_active: config.is_portal_active,
          capacity: config.capacity,
          control_mode: config.control_mode
        })
        .eq('id', config.id)

      if (error) throw error

      // Trigger capacity redistribution
      await updateCapacity(config.capacity)
      
      toast.success("System parameters synchronized.")
    } catch (err: any) {
      toast.error("Update failed: " + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading System Matrix...</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto py-12 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      
      {/* Centered Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex p-5 bg-slate-900 text-white rounded-[32px] mb-2 shadow-2xl">
          <Settings2 size={36} />
        </div>
        <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase leading-none text-center">Configuration</h1>
        <p className="text-slate-500 font-medium italic text-center">Master controls for system-wide enrollment parameters</p>
      </div>

      {/* 1. LOGIC MODE TOGGLE SELECTOR */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          type="button"
          onClick={() => setConfig({...config, control_mode: 'automatic'})}
          className={`p-6 rounded-[32px] border-2 transition-all flex flex-col items-center gap-3 ${config.control_mode === 'automatic' ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-white opacity-40 hover:opacity-100'}`}
        >
          <Clock className={config.control_mode === 'automatic' ? 'text-blue-600' : 'text-slate-400'} size={24} />
          <div className="text-center">
            <p className="font-black uppercase text-[10px] tracking-widest">Automatic</p>
            <p className="text-[9px] font-medium italic opacity-60">Date-Based Range</p>
          </div>
        </button>
        <button 
          type="button"
          onClick={() => setConfig({...config, control_mode: 'manual'})}
          className={`p-6 rounded-[32px] border-2 transition-all flex flex-col items-center gap-3 ${config.control_mode === 'manual' ? 'border-orange-600 bg-orange-50' : 'border-slate-100 bg-white opacity-40 hover:opacity-100'}`}
        >
          <Hand className={config.control_mode === 'manual' ? 'text-orange-600' : 'text-slate-400'} size={24} />
          <div className="text-center">
            <p className="font-black uppercase text-[10px] tracking-widest">Manual</p>
            <p className="text-[9px] font-medium italic opacity-60">Master Kill Switch</p>
          </div>
        </button>
      </div>

      <div className="space-y-6">
        
        {/* 2. CONDITIONAL CONTROLS */}
        {config.control_mode === 'automatic' ? (
          <Card className="p-10 rounded-[48px] border-none shadow-sm bg-white space-y-8 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><CalendarDays size={20} /></div>
              <h2 className="font-black text-xs uppercase tracking-widest text-slate-800">Enrollment Window</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Opening Date</label>
                <Input 
                  type="date" 
                  value={config.enrollment_start}
                  onChange={(e) => setConfig({...config, enrollment_start: e.target.value})}
                  className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Closing Date</label>
                <Input 
                  type="date" 
                  value={config.enrollment_end}
                  onChange={(e) => setConfig({...config, enrollment_end: e.target.value})}
                  className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold"
                />
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-10 rounded-[48px] border-none shadow-sm bg-white flex items-center justify-between group animate-in slide-in-from-top-2">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-3xl transition-all ${config.is_portal_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                <Globe size={28} />
              </div>
              <div>
                <h3 className="font-black uppercase text-xs tracking-widest">Public Access Portal</h3>
                <p className="text-slate-400 text-[10px] italic font-medium">Override Mode: {config.is_portal_active ? 'Accepting Forms' : 'System Locked'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <span className={`text-[10px] font-black uppercase tracking-widest ${config.is_portal_active ? 'text-green-600' : 'text-red-500'}`}>
                 {config.is_portal_active ? "LIVE" : "KILLED"}
               </span>
               <Switch 
                checked={config.is_portal_active} 
                onCheckedChange={(val) => setConfig({...config, is_portal_active: val})}
                className="data-[state=checked]:bg-green-500 scale-125"
              />
            </div>
          </Card>
        )}

        {/* 3. SYSTEM PARAMETERS (Always Centered & Visible) */}
        <Card className="p-10 rounded-[48px] border-none shadow-sm bg-white space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><ShieldCheck size={20} /></div>
            <h2 className="font-black text-xs uppercase tracking-widest text-slate-800">System Parameters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Portal Version (S.Y.)</label>
              <Input 
                placeholder="e.g. 2025-2026"
                value={config.school_year}
                onChange={(e) => setConfig({...config, school_year: e.target.value})}
                className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-black text-slate-900 uppercase"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Max Capacity</label>
              <Input 
                type="number"
                value={config.capacity}
                onChange={(e) => setConfig({...config, capacity: parseInt(e.target.value) || 0})}
                className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-black text-slate-900"
              />
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
             <AlertTriangle size={16} className="text-blue-600 mt-0.5" />
             <p className="text-[10px] text-blue-700 font-medium leading-relaxed uppercase tracking-tight">
               Committing changes will automatically recalibrate section capacities to match the new load.
             </p>
          </div>
        </Card>

        {/* MASTER SAVE BUTTON */}
        <div className="pt-4">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-20 rounded-[32px] bg-slate-900 hover:bg-black text-white font-black uppercase tracking-[0.4em] text-xs shadow-2xl shadow-slate-300 transition-all hover:-translate-y-1 active:scale-95"
          >
            {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-3" size={20} />}
            Synchronize Configuration
          </Button>
        </div>
      </div>
    </div>
  )
}