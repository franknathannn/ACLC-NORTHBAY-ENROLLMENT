"use client"

import { useState, useEffect, useRef } from "react"
import { useEnrollmentStore } from "@/store/useEnrollmentStore"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  Loader2, User, BookOpen, ShieldCheck, BadgeCheck, 
  MapPin, Phone, Mail, FileText, Sparkles, Building2, PartyPopper,
  ChevronLeft, Search, X, Maximize2, Orbit
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { getEnrollmentStatus } from "@/lib/actions/settings" 
import { toast } from "sonner"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogTrigger 
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export default function Step5Review() {
  const { formData, setStep, resetForm } = useEnrollmentStore()
  const [loading, setLoading] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [activeSY, setActiveSY] = useState("...")
  const router = useRouter()
  const successCanvasRef = useRef<HTMLCanvasElement>(null)
  const headerCanvasRef = useRef<HTMLCanvasElement>(null)

  const isJHS = formData.student_category === "JHS Graduate"

  useEffect(() => {
    async function getSY() {
      const { data } = await supabase.from('system_config').select('school_year').single()
      if (data) setActiveSY(data.school_year)
    }
    getSY()
  }, [])

  // --- LOCALIZED HEADER CONSTELLATION ---
  useEffect(() => {
    const canvas = headerCanvasRef.current;
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
          vx: (Math.random() - 0.5) * 0.3, 
          vy: (Math.random() - 0.5) * 0.3, 
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

  // --- SUCCESS CELEBRATION CONSTELLATION ---
  useEffect(() => {
    if (!showCelebration || !successCanvasRef.current) return;
    const canvas = successCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let particles: any[] = [];
    const init = () => {
      canvas.width = 400; canvas.height = 400;
      for (let i = 0; i < 40; i++) {
        particles.push({
          x: 200, y: 200, 
          vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
          size: Math.random() * 3
        });
      }
    };
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(59, 130, 246, 0.6)";
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      });
      requestAnimationFrame(animate);
    };
    init(); animate();
  }, [showCelebration]);

  const handleFinalSubmit = async () => {
    setLoading(true)
    const toastId = toast.loading(formData.id ? "Syncing corrections..." : "Transmitting application...")

    try {
      const isSystemOpen = await getEnrollmentStatus()
      if (!isSystemOpen && !formData.id) {
        toast.error("Admissions window is currently closed.", { id: toastId })
        return
      }

      const studentData: any = {
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        age: parseInt(formData.age || "0"),
        gender: formData.gender,
        civil_status: formData.civil_status,
        birth_date: formData.birth_date,
        religion: formData.religion,
        address: formData.address,
        email: formData.email,
        phone: formData.phone,
        lrn: formData.lrn,
        strand: formData.strand,
        student_category: formData.student_category,
        last_school_attended: formData.last_school_attended,
        school_year: activeSY,
        gwa_grade_10: isJHS ? formData.gwa_grade_10 : null,
        guardian_first_name: formData.guardian_first_name,
        guardian_middle_name: formData.guardian_middle_name,
        guardian_last_name: formData.guardian_last_name,
        guardian_phone: formData.guardian_phone,
        form_138_url: isJHS ? formData.form_138_url : null,
        good_moral_url: isJHS ? formData.good_moral_url : null,
        two_by_two_url: formData.profile_2x2_url,
        cor_url: !isJHS ? formData.cor_url : null,
        af5_url: !isJHS ? formData.af5_url : null,
        diploma_url: !isJHS ? formData.diploma_url : null,
        status: 'Pending',
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('students')
        .upsert({
          ...(formData.id ? { id: formData.id } : {}),
          ...studentData
        }, { onConflict: 'lrn' })

      if (error) throw error

      // Force refresh on admin side via broadcast
      const channel = supabase.channel('admin_applicants_realtime')
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'student_update',
            payload: { timestamp: new Date().toISOString() }
          })
          setTimeout(() => supabase.removeChannel(channel), 2000)
        }
      })

      toast.success("Identity Indexed Successfully", { id: toastId })
      setShowCelebration(true)
      
      setTimeout(() => {
        const queryParams = new URLSearchParams({
          name: formData.first_name || "",
          lrn: formData.lrn || "",
          strand: formData.strand || ""
        }).toString()
        resetForm()
        router.push(`/enroll/success?${queryParams}`)
      }, 3500)

    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-1000 pb-10">
      
      {/* HEADER SECTION: Constellation Engine Applied */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-8 relative overflow-hidden group rounded-[32px] p-6 bg-blue-600/5">
        <canvas ref={headerCanvasRef} className="absolute inset-0 pointer-events-none opacity-40" />
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <BadgeCheck size={32} />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-white uppercase italic leading-none">Review Information</h2>
            <p className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.4em] mt-2">Step 05 • Final Application Verification</p>
          </div>
        </div>
        <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 text-white font-black text-[9px] uppercase tracking-widest relative z-10">
           S.Y. {activeSY}
        </div>
      </div>

      {/* Main Review Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <ReviewSection 
            icon={<User className="text-blue-400" size={18} />} 
            title="Student Identity" 
            details={[
              { label: "Designation", value: `${formData.first_name} ${formData.middle_name} ${formData.last_name}` },
              { label: "Profile Matrix", value: `${formData.gender} | ${formData.age} yrs | ${formData.civil_status}` },
              { label: "Registry LRN", value: formData.lrn },
              { label: "Origin Date", value: formData.birth_date }
            ]}
          />

          <ReviewSection 
            icon={<MapPin className="text-blue-400" size={18} />} 
            title="Contacts" 
            details={[
              { label: "Residential Hub", value: formData.address },
              { label: "Primary Contact", value: formData.phone },
              { label: "Digital Mail", value: formData.email }
            ]}
          />

          <ReviewSection 
            icon={<BookOpen className="text-blue-400" size={18} />} 
            title="Academic Preferrences" 
            details={[
              { label: "Directive (Strand)", value: formData.strand },
              { label: "Categorization", value: formData.student_category },
              { label: "Guardian node", value: `${formData.guardian_first_name} ${formData.guardian_last_name}` }
            ]}
          />
        </div>

        <div className="lg:col-span-1 space-y-4">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Verification Assets</p>
           <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              <DocThumbnail label="ID" url={formData.profile_2x2_url ?? null} />
              {isJHS ? (
                <>
                  <DocThumbnail label="F-138" url={formData.form_138_url ?? null} />
                  <DocThumbnail label="G-Moral" url={formData.good_moral_url ?? null} />
                </>
              ) : (
                <>
                  <DocThumbnail label="ALS COR" url={formData.cor_url ?? null} />
                  <DocThumbnail label="Diploma" url={formData.diploma_url ?? null} />
                </>
              )}
           </div>
        </div>
      </div>

      {/* INSTITUTIONAL AFFIRMATION */}
      <Card className="p-8 bg-blue-600/10 rounded-[32px] border border-blue-500/20 text-white flex gap-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 transition-transform group-hover:scale-125 duration-1000">
           <ShieldCheck size={140} className="text-blue-400" />
        </div>
        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg">
           <ShieldCheck className="text-white" size={28} />
        </div>
        <div className="space-y-1 relative z-10">
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em]">Submission Directive</p>
          <p className="text-sm font-medium leading-relaxed opacity-90 italic">
            "I hereby verify that all uploaded assets and data strings are authentic. Misrepresentation will trigger immediate matrix invalidation."
          </p>
        </div>
      </Card>

      {/* FOOTER ACTIONS */}
      <div className="flex flex-col sm:flex-row gap-5 pt-8">
        <Button 
          variant="ghost" 
          onClick={() => setStep(4)} 
          className="h-16 px-12 rounded-[28px] font-black uppercase text-[11px] tracking-[0.3em] text-slate-500 hover:text-white hover:bg-white/5 transition-all"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Edit
        </Button>
        
        <Button 
          onClick={handleFinalSubmit} 
          disabled={loading}
          className="flex-1 h-16 md:h-20 bg-blue-600 hover:bg-white hover:text-blue-600 text-white rounded-[32px] shadow-[0_20px_50px_rgba(59,130,246,0.3)] transition-all active:scale-95 flex items-center justify-center gap-4 group"
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              <Sparkles size={20} /> 
              <span className="font-black uppercase text-sm tracking-[0.4em]">Upload Application</span>
            </>
          )}
        </Button>
      </div>

      {/* CELEBRATION PORTAL */}
      <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-[56px] border-white/10 shadow-2xl bg-slate-950">
          <DialogHeader className="sr-only">
            <DialogTitle>Success</DialogTitle>
            <DialogDescription>Application transmitted.</DialogDescription>
          </DialogHeader>
          <div className="p-12 text-center space-y-8 relative overflow-hidden">
            <canvas ref={successCanvasRef} className="absolute inset-0 pointer-events-none" />
            <div className="absolute inset-0 bg-blue-600/10 blur-[100px]" />
            <div className="relative z-10">
              <div className="w-24 h-24 bg-blue-600 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-[0_20px_60px_rgba(59,130,246,0.5)] rotate-6">
                <Building2 className="text-white" size={48} />
              </div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none italic">
                Matrix <br /> <span className="text-blue-500">Synchronized</span>
              </h2>
              <p className="text-slate-400 text-xs font-medium italic mt-6 leading-relaxed">
                Welcome to the digital constellation. Your journey at ACLC Northbay has been initialized.
              </p>
            </div>
            <div className="relative z-10 flex items-center justify-center gap-4 text-blue-400">
               <Orbit className="animate-spin" style={{animationDuration: '10s'}} />
               <p className="text-[10px] font-black uppercase tracking-[0.5em]">Establishing ID Profile...</p>
               <Orbit className="animate-spin-reverse" style={{animationDuration: '10s'}} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ReviewSection({ icon, title, details }: any) {
  return (
    <Card className="p-8 rounded-[32px] border border-blue-900/40 bg-slate-950/60 hover:bg-white/[0.08] transition-all duration-500 w-full overflow-hidden shadow-inner">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-blue-600/20 rounded-2xl border border-blue-500/20 shrink-0">{icon}</div>
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] italic truncate">{title}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
        {details.map((d: any, i: number) => (
          <div key={i} className="space-y-1.5 min-w-0">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest truncate">{d.label}</p>
            <p className="text-sm md:text-base font-bold text-white uppercase leading-tight break-words">
              {d.value || "—"}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}

function DocThumbnail({ label, url }: { label: string, url: string | null }) {
  if (!url) return null;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="group relative aspect-square rounded-[28px] overflow-hidden bg-slate-950 border border-blue-900/40 cursor-pointer transition-all hover:border-blue-500/50 shadow-inner">
          <img src={url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700" alt={label} />
          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <Maximize2 className="text-white w-5 h-5" />
          </div>
          <div className="absolute bottom-3 left-0 w-full text-center">
             <p className="text-[8px] font-black text-white uppercase tracking-widest opacity-60">{label}</p>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-slate-950/95 border-white/10 text-white rounded-[40px]">
          <DialogHeader>
            <DialogTitle className="text-white uppercase font-black tracking-widest">{label} verification</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4 bg-slate-900 rounded-3xl border border-white/5 shadow-2xl">
             <img src={url} className="max-h-[70vh] object-contain rounded-xl shadow-2xl" alt="HD Preview" />
          </div>
      </DialogContent>
    </Dialog>
  )
}