"use client"

import { useState, Suspense, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
import { useEnrollmentStore } from "@/store/useEnrollmentStore"
import { useRouter } from "next/navigation"
import { 
  Search, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  MapPin, 
  Clock,
  ArrowLeft,
  FileEdit,
  ShieldCheck,
  Fingerprint,
  Orbit
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

function StatusContent() {
  const [lrn, setLrn] = useState("")
  const [lastName, setLastName] = useState("") 
  const [result, setResult] = useState<any>(null)
  const [activeSY, setActiveSY] = useState("...")
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  
  const heroCanvasRef = useRef<HTMLCanvasElement>(null)
  const { updateFormData, setStep } = useEnrollmentStore()
  const router = useRouter()

  const isLrnComplete = lrn.length === 12;

  // --- 1. PERSISTENCE LOGIC (RETAIN ON RELOAD) ---
  useEffect(() => {
    const savedLrn = sessionStorage.getItem("matrix_search_lrn");
    const savedName = sessionStorage.getItem("matrix_search_name");
    if (savedLrn && savedName) {
      setLrn(savedLrn);
      setLastName(savedName);
      setTimeout(() => performSearch(savedLrn, savedName), 100);
    }
  }, []);

  // --- 2. LOCALIZED SEARCH NOVA ENGINE ---
  useEffect(() => {
    const canvas = heroCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let particles: any[] = [];
    const init = () => {
      canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
      for (let i = 0; i < 40; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          size: Math.random() * 2
        });
      }
    };
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(59, 130, 246, 0.4)";
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      });
      requestAnimationFrame(animate);
    };
    init(); animate();
  }, []);

  useEffect(() => {
    async function getSY() {
      const { data } = await supabase.from('system_config').select('school_year').single()
      if (data) setActiveSY(data.school_year)
    }
    getSY()
  }, [])

  // --- 3. REALTIME STATUS SYNC ---
  useEffect(() => {
    if (!result?.id) return

    const channel = supabase
      .channel(`status_watch_${result.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'students', 
        filter: `id=eq.${result.id}` 
      }, async () => {
        const { data } = await supabase
          .from('students')
          .select(`*, sections ( section_name )`)
          .eq('id', result.id)
          .single()
        
        if (data) {
          setResult(data)
          toast.success("Status Matrix Updated Live", { icon: <Orbit className="animate-spin text-blue-500" /> })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [result?.id])

  const performSearch = async (searchLrn: string, searchName: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`*, sections ( section_name )`)
        .eq('lrn', searchLrn)
        .ilike('last_name', searchName)
        .single()

      if (error || !data) {
        setResult(null)
        if (hasSearched) toast.error("Record not found in the Northbay Matrix.")
      } else {
        setResult(data)
        sessionStorage.setItem("matrix_search_lrn", searchLrn);
        sessionStorage.setItem("matrix_search_name", searchName);
      }
    } catch (error) {
      setResult(null)
    } finally {
      setHasSearched(true)
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(lrn, lastName);
  }

  const handleFixApplication = () => {
    const toastId = toast.loading("Restoring identity data...")
    updateFormData({
      ...result,
      id: result.id,
      profile_2x2_url: result.two_by_two_url,
      phone: result.phone || result.contact_no
    })
    setStep(1)
    setTimeout(() => {
      toast.success("Editor ready.", { id: toastId })
      router.push('/enroll')
    }, 800)
  }

  return (
    <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 relative z-10">
      
      <div className="flex justify-start">
        <Link href="/">
          <Button variant="ghost" className="rounded-xl font-black uppercase text-[10px] tracking-[0.2em] text-slate-500 hover:text-white hover:bg-white/5 transition-all">
            <ArrowLeft className="mr-2 w-4 h-4" /> Go Back to Homepage
          </Button>
        </Link>
      </div>

      <div className="text-center space-y-6 relative overflow-hidden group">
        <canvas ref={heroCanvasRef} className="absolute inset-0 pointer-events-none opacity-50" />
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-blue-600/20 blur-2xl animate-pulse rounded-full" />
          <div className="w-20 h-20 bg-slate-900 border border-white/10 rounded-[32px] shadow-2xl flex items-center justify-center mx-auto text-blue-400 relative z-10">
            <ShieldCheck size={36} />
          </div>
          <Orbit size={100} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-900/30 animate-spin-slow pointer-events-none" />
        </div>
        <div className="space-y-2 relative z-10">
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">Portal Status</h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[9px]">Authentication Cycle S.Y. {activeSY}</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="space-y-4 mt-10 relative z-10">
        <div className="relative group">
          <Fingerprint className={cn("absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors", isLrnComplete ? 'text-blue-400' : 'text-slate-700')} />
          <Input 
            placeholder="12-DIGIT LRN" 
            value={lrn}
            onChange={(e) => setLrn(e.target.value.replace(/\D/g, ''))}
            maxLength={12}
            className="h-16 pl-14 rounded-[28px] border-2 border-white/5 bg-white/5 text-white text-lg font-mono font-bold tracking-[0.2em] focus:border-blue-500 focus:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all outline-none"
          />
        </div>

        <Input 
          placeholder="SURNAME (LAST NAME)" 
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="h-16 px-8 rounded-[28px] border-2 border-white/5 bg-white/5 text-white text-md font-black uppercase tracking-widest focus:border-blue-500 focus:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all outline-none"
        />
        
        <Button 
          disabled={!isLrnComplete || !lastName || loading}
          className="w-full h-16 rounded-[28px] bg-blue-600 hover:bg-white hover:text-blue-600 text-white font-black uppercase text-[11px] tracking-[0.4em] shadow-[0_15px_40px_rgba(59,130,246,0.3)] transition-all active:scale-95 flex items-center justify-center gap-3 group"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : (
            <>
              Verify Identity <Search size={16} className="group-hover:scale-110 transition-transform" />
            </>
          )}
        </Button>
      </form>

      <div className="space-y-4 relative z-10">
        {hasSearched && result && (
          <Card className="p-1 rounded-[48px] border-none bg-gradient-to-br from-blue-500/20 to-transparent shadow-2xl animate-in zoom-in-95 duration-500 relative overflow-hidden backdrop-blur-3xl">
            <div className="bg-slate-950/90 p-10 rounded-[46px] space-y-10">
                {/* Result Accent Bar (Green for Accepted) */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 opacity-50 transition-colors duration-1000 ${
                result.status === 'Approved' || result.status === 'Accepted' ? 'bg-green-500' : 
                result.status === 'Rejected' ? 'bg-red-500' : 'bg-amber-400'
                }`} />

                <div className="flex justify-between items-start gap-4 border-b border-white/5 pb-8">
                    <div className="space-y-2">
                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.4em]">Official Designation</p>
                        <h3 className="text-3xl font-black text-white leading-none uppercase tracking-tighter italic">
                            {result.last_name},<br />
                            <span className="text-blue-100">{result.first_name} {result.middle_name}</span>
                        </h3>
                    </div>
                    <StatusBadge status={result.status} />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">Matrix Strand</p>
                        <p className="text-sm font-black text-white uppercase">{result.strand}</p>
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">Tracking ID</p>
                        <p className="text-sm font-mono font-bold text-blue-400">{result.lrn}</p>
                    </div>
                </div>

                <div key={result.status} className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                {result.status === 'Rejected' && (
                    <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="p-6 bg-red-900/20 rounded-[32px] border border-red-500/20 space-y-3">
                        <div className="flex items-center gap-2 text-red-400">
                            <AlertCircle size={14} />
                            <p className="text-[10px] font-black uppercase tracking-widest">Correction Directive</p>
                        </div>
                        <p className="text-sm font-bold text-red-200 leading-relaxed italic">
                            "{result.registrar_feedback || "Correction needed. Please re-verify your requirements."}"
                        </p>
                    </div>
                    <Button onClick={handleFixApplication} className="w-full h-16 bg-white text-slate-950 hover:bg-blue-600 hover:text-white rounded-[24px] font-black uppercase text-[11px] tracking-[0.3em] shadow-xl flex items-center justify-center gap-3 transition-all">
                        <FileEdit size={18} /> Initialize Repair
                    </Button>
                    </div>
                )}

                {(result.status === 'Approved' || result.status === 'Accepted') && (
                    <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="p-8 bg-green-900/10 rounded-[40px] border border-green-500/20 flex items-center justify-between shadow-inner">
                        <div>
                            <p className="text-[9px] font-black text-green-400 uppercase tracking-[0.4em] mb-2">Assigned Sector</p>
                            <p className="text-3xl font-black text-white tracking-tighter uppercase italic">
                                {result.sections?.section_name || "Assigning..."}
                            </p>
                        </div>
                        <div className="w-16 h-16 bg-green-600 rounded-[24px] flex items-center justify-center shadow-lg shadow-green-500/40">
                            <MapPin className="text-white w-8 h-8" />
                        </div>
                    </div>
                    </div>
                )}

                {result.status === 'Pending' && (
                    <div className="p-10 bg-white/5 rounded-[40px] border border-white/5 flex flex-col items-center text-center gap-6 shadow-inner">
                    <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center border border-white/5 shadow-2xl relative">
                        <Clock className="text-blue-500 w-10 h-10 animate-pulse" />
                        <Orbit size={100} className="absolute text-blue-500/10 animate-spin-slow" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-lg font-black text-white uppercase tracking-tighter italic">Validation Sequence Active</p>
                        <p className="text-[11px] font-medium text-slate-500 italic max-w-[240px] leading-relaxed uppercase tracking-widest">
                            Intelligence is validating your assets. Synchronization will update in 48 Earth hours.
                        </p>
                    </div>
                    </div>
                )}
                </div>
            </div>
          </Card>
        )}

        {hasSearched && !result && (
          <div className="text-center py-20 px-10 border-2 border-dashed border-white/10 rounded-[56px] bg-white/[0.02] animate-in fade-in zoom-in-95 duration-700">
            <XCircle className="w-16 h-16 text-slate-800 mx-auto mb-6 opacity-50" />
            <div className="space-y-2">
              <p className="text-white font-black uppercase tracking-[0.2em] text-lg">No Records Localized</p>
              <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em] italic">Verify Registry LRN and Surname spelling.</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="text-center pt-10">
        <p className="text-[9px] font-black text-slate-700 uppercase tracking-[1em] animate-pulse">
          NORTHBAY TERMINAL • {activeSY}
        </p>
      </div>
    </div>
  )
}

// --- MAIN PAGE WRAPPER ---
export default function StatusPage() {
  const globalCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = globalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let particles: any[] = [];
    const init = () => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      for (let i = 0; i < 100; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5,
          sx: (Math.random() - 0.5) * 0.15,
          sy: (Math.random() - 0.5) * 0.15
        });
      }
    };
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      particles.forEach(p => {
        p.x += p.sx; p.y += p.sy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      });
      requestAnimationFrame(animate);
    };
    init(); animate();
    window.addEventListener("resize", init);
    return () => window.removeEventListener("resize", init);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center p-6 pt-16 relative overflow-hidden">
      <canvas ref={globalCanvasRef} className="absolute inset-0 pointer-events-none z-0" />
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-900/20 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-900/10 rounded-full blur-[160px] pointer-events-none" />

      <Suspense fallback={
        <div className="flex flex-col items-center justify-center gap-6 mt-32 relative z-10">
          <Loader2 className="animate-spin text-blue-500 w-12 h-12" />
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400 animate-pulse">Synchronizing Node...</p>
        </div>
      }>
        <StatusContent />
      </Suspense>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    Pending: "bg-amber-900/30 text-amber-500 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
    Accepted: "bg-green-900/30 text-green-400 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]",
    Approved: "bg-green-900/30 text-green-400 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]",
    Rejected: "bg-red-900/30 text-red-500 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]",
  }
  return (
    <div className={cn("px-5 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest backdrop-blur-md", styles[status] || styles.Pending)}>
      {status === 'Approved' || status === 'Accepted' ? 'Accepted' : status}
    </div>
  )
}