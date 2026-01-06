"use client"
import { useEffect, useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { useEnrollmentStore } from "@/store/useEnrollmentStore"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight, ChevronLeft, GraduationCap, School, CalendarDays, Loader2, Fingerprint, Star, Sparkles, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function Step2Academic() {
  const { formData, updateFormData, setStep } = useEnrollmentStore()
  const [dbSchoolYear, setDbSchoolYear] = useState<string>("")
  const [fetchingYear, setFetchingYear] = useState(true)
  const headerCanvasRef = useRef<HTMLCanvasElement>(null)
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({ 
    defaultValues: {
      lrn: formData.lrn || "",
      school_year: formData.school_year || "", 
      student_category: formData.student_category || "JHS Graduate",
      strand: formData.strand || "",
      last_school_attended: formData.last_school_attended || "",
      gwa_grade_10: formData.gwa_grade_10 || ""
    } 
  })

  const allValues = watch();
  const selectedCategory = watch("student_category");
  const selectedStrand = watch("strand");

  // --- LOCALIZED HEADER CONSTELLATION ENGINE ---
  useEffect(() => {
    const canvas = headerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: { x: number; y: number; vx: number; vy: number; size: number }[] = [];
    const mouse = { x: -1000, y: -1000 };

    const init = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      particles = [];
      for (let i = 0; i < 35; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 1.5 + 0.5
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(59, 130, 246, 0.4)"; 
      
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.lineWidth = 0.8;
          ctx.strokeStyle = `rgba(59, 130, 246, ${1 - dist / 100})`;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      });
      requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    window.addEventListener("resize", init);
    canvas.addEventListener("mousemove", handleMouseMove);
    init(); animate();

    return () => {
      window.removeEventListener("resize", init);
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    async function fetchActiveYear() {
      try {
        const { data } = await supabase.from('system_config').select('school_year').single()
        if (data?.school_year) {
          setDbSchoolYear(data.school_year)
          setValue("school_year", data.school_year)
        }
      } catch (err) {
        console.error("Failed to fetch SY:", err)
      } finally {
        setFetchingYear(false)
      }
    }
    fetchActiveYear()
  }, [setValue])

  const onSubmit = (data: any) => {
    updateFormData(data)
    setStep(3)
    toast.success("Academic Intelligence Synchronized", {
      icon: <Sparkles className="text-blue-400" />
    })
  }

  // UPDATED: Muted darker highlights + Intense Glow Tracer on Focus
  const getFieldClassName = (fieldName: string, isLRN = false) => {
    const value = (allValues as any)[fieldName];
    const hasError = (errors as any)[fieldName];
    const isNotEmpty = value && value.toString().trim() !== "";

    return cn(
      "h-12 md:h-14 rounded-xl md:rounded-2xl border-2 transition-all duration-300 font-bold outline-none text-white",
      isLRN ? "font-mono text-base md:text-lg tracking-[0.15em] md:tracking-[0.3em]" : "text-sm md:text-base",
      // GLOW TRACER Focus state
      "focus:border-blue-500 focus:shadow-[0_0_20px_rgba(59,130,246,0.3)] focus:bg-slate-900/80",
      hasError 
        ? "border-red-900/50 bg-red-950/30" 
        : isNotEmpty 
          ? "border-blue-900/40 bg-slate-950/60 text-blue-100" // DARKER MUTED HIGHLIGHT
          : "border-white/5 bg-white/5"
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-6 duration-1000 pb-10">
      
      {/* SECTION HEADER: Constellation Engine Applied */}
      <div className="bg-blue-600/10 rounded-[32px] p-6 border border-blue-500/20 text-white flex items-center gap-5 shadow-2xl relative overflow-hidden group">
        <canvas ref={headerCanvasRef} className="absolute inset-0 pointer-events-auto z-0" />
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0 relative z-10 shadow-lg shadow-blue-500/20">
          <GraduationCap className="text-white w-7 h-7" />
        </div>
        <div className="relative z-10">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-400 mb-1">Step 02</p>
          <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase italic text-white leading-none">Academic Background</h2>
        </div>
      </div>

      {/* ROW 1: LRN */}
      <div className="relative z-[100] space-y-2 group">
        <Label htmlFor="lrn" className={cn("font-black text-[10px] uppercase tracking-[0.3em] ml-2 transition-colors group-focus-within:text-blue-400", errors.lrn ? 'text-red-500' : 'text-slate-500')}>Learners Reference Number (LRN) *</Label>
        <div className="relative">
          <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-700 transition-colors group-focus-within:text-blue-400" />
          <Input 
            {...register("lrn", { 
              required: true, 
              pattern: /^\d{12}$/,
              onChange: (e) => {
                // Only allow numbers
                setValue("lrn", e.target.value.replace(/\D/g, ''));
              }
            })} 
            id="lrn"
            placeholder="000000000000" 
            maxLength={12}
            className={cn("pl-12", getFieldClassName("lrn", true))}
          />
        </div>
      </div>

      {/* ROW 2: Student Category & SY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative z-[90]">
        <div className="space-y-2 group">
          <Label className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] ml-2 transition-colors group-focus-within:text-blue-400">Intel Classification *</Label>
          <Select 
            onValueChange={(v) => {
              const value = v as "JHS Graduate" | "ALS Passer";
              setValue("student_category", value);
              updateFormData({ student_category: value });
            }} 
            defaultValue={formData.student_category || "JHS Graduate"}
          >
            <SelectTrigger className={cn(
                "h-12 md:h-14 rounded-xl md:rounded-2xl border-2 font-bold text-sm transition-all text-white focus:ring-0",
                "focus:border-blue-500 focus:shadow-[0_0_20px_rgba(59,130,246,0.3)]",
                selectedCategory ? "border-blue-900/40 bg-slate-950/60" : "border-white/5 bg-white/5"
            )}>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl shadow-2xl border border-white/10 bg-slate-900 text-white">
              <SelectItem value="JHS Graduate" className="font-bold py-3 focus:bg-blue-600 focus:text-white">JHS Graduate</SelectItem>
              <SelectItem value="ALS Passer" className="font-bold py-3 focus:bg-blue-600 focus:text-white">ALS Passer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] ml-2">Active Temporal Cycle</Label>
          <div className="h-12 md:h-14 rounded-xl md:rounded-2xl border border-white/10 bg-slate-950/30 flex items-center px-4 gap-3 text-white shadow-inner">
            {fetchingYear ? <Loader2 size={16} className="animate-spin text-blue-600" /> : <CalendarDays size={16} className="text-blue-700" />}
            <span className="font-black uppercase tracking-tighter text-[10px] md:text-xs text-slate-400">
              {fetchingYear ? "Syncing..." : `S.Y. ${dbSchoolYear}`}
            </span>
          </div>
        </div>
      </div>

      {/* ROW 3: Strand Selection */}
      <div className="relative z-[80] space-y-2 group">
        <Label className={cn("font-black text-[10px] uppercase tracking-[0.3em] ml-2 transition-colors group-focus-within:text-blue-400", errors.strand ? 'text-red-500' : 'text-slate-500')}>Strand Preferrence *</Label>
        <Select 
          onValueChange={(v) => {
            setValue("strand", v, { shouldValidate: true })
            updateFormData({ strand: v })
          }} 
          defaultValue={formData.strand}
        >
          <SelectTrigger className={cn(
              "h-12 md:h-14 rounded-xl md:rounded-2xl border-2 font-bold text-sm transition-all text-white focus:ring-0",
              "focus:border-blue-500 focus:shadow-[0_0_20px_rgba(59,130,246,0.3)]",
              selectedStrand ? "border-blue-900/40 bg-slate-950/60" : "border-white/5 bg-white/5"
          )}>
            <SelectValue placeholder="Choose specialized division" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl shadow-2xl border border-white/10 bg-slate-900 text-white">
            <SelectItem value="ICT" className="font-bold py-3 focus:bg-blue-600 focus:text-white">Information and Communication Technology (ICT) </SelectItem>
            <SelectItem value="GAS" className="font-bold py-3 focus:bg-blue-600 focus:text-white">General Academics (GAS)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ROW 4: Last School */}
      <div className="relative z-[10] space-y-2 group">
        <Label htmlFor="last_school" className={cn("font-black text-[10px] uppercase tracking-[0.3em] ml-2 transition-colors group-focus-within:text-blue-400", errors.last_school_attended ? 'text-red-500' : 'text-slate-500')}>Previous School *</Label>
        <div className="relative">
            <School className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 transition-colors ${errors.last_school_attended ? 'text-red-400' : 'text-blue-700 group-focus-within:text-blue-400'}`} />
            <Input 
                {...register("last_school_attended", { required: true })} 
                id="last_school"
                placeholder="PREVIOUS SCHOOL NAME" 
                className={cn("pl-11 md:pl-12", getFieldClassName("last_school_attended"))}
            />
        </div>
      </div>

      {/* ROW 5: GWA */}
      {selectedCategory === "JHS Graduate" && (
        <div className="relative z-[0] space-y-2 group animate-in slide-in-from-top-4">
          <div className="flex justify-between items-center">
            <Label htmlFor="gwa" className={cn("font-black text-[10px] uppercase tracking-[0.3em] ml-2 transition-colors group-focus-within:text-blue-400", errors.gwa_grade_10 ? 'text-red-500' : 'text-slate-500')}>General Weighted Average (GWA) *</Label>
            {errors.gwa_grade_10 && (
              <span className="text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1 animate-in fade-in slide-in-from-right-2">
                <AlertTriangle size={10} /> {errors.gwa_grade_10.message as string}
              </span>
            )}
          </div>
          <div className="relative">
            <Star className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-700 transition-colors group-focus-within:text-blue-400" />
            <Input 
              {...register("gwa_grade_10", { 
                required: selectedCategory === "JHS Graduate",
                min: { value: 70, message: "Minimum grade is 70.00" },
                max: { value: 99.99, message: "Grade must be less than 100.00" },
                valueAsNumber: true
              })} 
              id="gwa"
              type="number" 
              step="0.01" 
              placeholder="00.00" 
              className={cn("pl-12", getFieldClassName("gwa_grade_10"))}
            />
          </div>
        </div>
      )}

      {/* FOOTER ACTIONS */}
      <div className="pt-10 flex flex-col gap-4">
        <Button 
          type="submit" 
          disabled={fetchingYear}
          className="h-16 md:h-20 rounded-[32px] bg-blue-600 hover:bg-white hover:text-blue-600 text-white shadow-[0_20px_50px_rgba(59,130,246,0.3)] transition-all duration-500 active:scale-95 flex items-center justify-center gap-4 group"
        >
          <span className="font-black uppercase text-sm tracking-[0.4em] ml-4 text-white group-hover:text-blue-600">Analyze Step 03</span>
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:scale-110 transition-all">
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Button>

        <button 
          type="button" 
          onClick={() => setStep(1)} 
          className="text-slate-600 font-black uppercase text-[9px] tracking-[0.4em] flex items-center justify-center gap-2 hover:text-white transition-colors py-4 group"
        >
          <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Go Back
        </button>
      </div>
    </form>
  )
}