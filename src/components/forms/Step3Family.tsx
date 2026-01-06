"use client"

import { useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { useEnrollmentStore } from "@/store/useEnrollmentStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, ChevronLeft, Users, Phone, Sparkles, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function Step3Family() {
  const { formData, updateFormData, setStep } = useEnrollmentStore()
  const headerCanvasRef = useRef<HTMLCanvasElement>(null)
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({ 
    defaultValues: {
      guardian_first_name: formData.guardian_first_name || "",
      guardian_middle_name: formData.guardian_middle_name || "",
      guardian_last_name: formData.guardian_last_name || "",
      guardian_phone: formData.guardian_phone || "",
      phone: formData.phone || "" 
    } 
  })

  const allValues = watch();

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
          size: Math.random() * 2 + 0.5
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

  const onSubmit = (data: any) => {
    updateFormData(data)
    setStep(4)
    toast.success("Contact Matrix Verified", {
      icon: <Sparkles className="text-blue-400" />
    })
  }

  // UPDATED: Muted darker highlights + Intense Glow Tracer on Focus
  const getFieldClassName = (fieldName: string) => {
    const value = (allValues as any)[fieldName];
    const hasError = (errors as any)[fieldName];
    const isNotEmpty = value && value.toString().trim() !== "";

    return cn(
      "h-12 md:h-14 rounded-xl md:rounded-2xl border-2 transition-all duration-300 font-bold outline-none text-white",
      // THE GLOW TRACER: Sharp blue border + pulsating shadow on focus
      "focus:border-blue-500 focus:shadow-[0_0_20px_rgba(59,130,246,0.3)] focus:bg-slate-900/80",
      hasError 
        ? "border-red-900/50 bg-red-950/30" 
        : isNotEmpty 
          ? "border-blue-900/40 bg-slate-950/60 text-blue-100" // DARKER MUTED HIGHLIGHT
          : "border-white/5 bg-white/5"
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-right-6 duration-1000 pb-10">
      
      {/* SECTION HEADER: Constellation Hub */}
      <div className="bg-blue-600/10 rounded-[32px] p-6 border border-blue-500/20 text-white flex items-center gap-5 shadow-2xl relative overflow-hidden group">
        <canvas ref={headerCanvasRef} className="absolute inset-0 pointer-events-auto z-0" />
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0 relative z-10 shadow-lg shadow-blue-500/20">
          <Users className="text-white w-7 h-7" />
        </div>
        <div className="relative z-10">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-400 mb-1">Step 03</p>
          <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase italic text-white leading-none">Family & Contacts</h2>
        </div>
      </div>

      {/* GUARDIAN IDENTITY MATRIX */}
      <div className="space-y-4">
        <Label className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] ml-2">Guardian Information *</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["guardian_first_name", "guardian_middle_name", "guardian_last_name"].map((field) => (
            <div key={field} className="space-y-1">
              <Input 
                {...register(field as any, { 
                  required: true,
                  onChange: (e) => {
                    // Allow only letters/spaces and force Title Case
                    const val = e.target.value.replace(/[^a-zA-Z\s]/g, '').replace(/\b\w/g, (c: string) => c.toUpperCase());
                    setValue(field as any, val);
                  }
                })} 
                placeholder={field.split('_')[1].toUpperCase() + " NAME"}
                className={getFieldClassName(field)} 
              />
            </div>
          ))}
        </div>
      </div>

      {/* CONTACT NODES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div className="space-y-2 group/field">
          <Label className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2 ml-2 transition-colors group-focus-within/field:text-blue-400">
             <Phone size={12} className="text-blue-700 transition-colors group-focus-within/field:text-blue-400" /> Guardian Contact No. *
          </Label>
          <Input 
            {...register("guardian_phone", { 
              required: true,
              pattern: { value: /^09\d{9}$/, message: "Must start with 09 and be 11 digits" },
              onChange: (e) => {
                // Only numbers, max 11 chars
                const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                setValue("guardian_phone", val);
              }
            })} 
            placeholder="09XX XXX XXXX"
            maxLength={11}
            className={getFieldClassName("guardian_phone")}
          />
        </div>

        <div className="space-y-2 group/field">
          <Label className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2 ml-2 transition-colors group-focus-within/field:text-blue-400">
             <Phone size={12} className="text-blue-700 transition-colors group-focus-within/field:text-blue-400" /> Student No. *
          </Label>
          <Input 
            {...register("phone", { 
              required: true,
              pattern: { value: /^09\d{9}$/, message: "Must start with 09 and be 11 digits" },
              onChange: (e) => {
                // Only numbers, max 11 chars
                const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                setValue("phone", val);
              }
            })} 
            placeholder="09XX XXX XXXX"
            maxLength={11}
            className={getFieldClassName("phone")}
          />
        </div>
      </div>

      {/* SYSTEM VALIDATION NOTICE */}
      <div className="p-6 bg-white/5 rounded-[32px] border border-white/5 flex items-center gap-4">
          <ShieldCheck size={24} className="text-blue-700 shrink-0" />
          <p className="text-[10px] font-bold text-slate-600 leading-relaxed uppercase tracking-widest">
            Ensure contact nodes are active. These will serve as the primary encrypted channels for enrollment status updates.
          </p>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="pt-10 flex flex-col gap-4">
        <Button 
          type="submit" 
          className="h-16 md:h-20 rounded-[32px] bg-blue-600 hover:bg-white hover:text-blue-600 text-white shadow-[0_20px_50px_rgba(59,130,246,0.3)] transition-all duration-500 active:scale-95 flex items-center justify-center gap-4 group"
        >
          <span className="font-black uppercase text-sm tracking-[0.4em] ml-4 text-white group-hover:text-blue-600">Analyze Step 04</span>
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:scale-110 transition-all">
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Button>

        <button 
          type="button" 
          onClick={() => setStep(2)} 
          className="text-slate-600 font-black uppercase text-[9px] tracking-[0.4em] flex items-center justify-center gap-2 hover:text-white transition-colors py-4 group"
        >
          <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Go Back
        </button>
      </div>
    </form>
  )
}