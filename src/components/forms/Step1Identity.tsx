"use client"

import { useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { useEnrollmentStore } from "@/store/useEnrollmentStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup } from "@/components/ui/radio-group"
import { ArrowRight, User, Calendar, BookOpen, MapPin, Heart, ChevronDown, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function Step1Identity() {
  const { formData, updateFormData, setStep } = useEnrollmentStore()
  const headerCanvasRef = useRef<HTMLCanvasElement>(null)
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({ 
    defaultValues: {
      first_name: formData.first_name || "",
      middle_name: formData.middle_name || "",
      last_name: formData.last_name || "",
      email: formData.email || "",
      age: formData.age || "",
      gender: formData.gender || "", 
      civil_status: formData.civil_status || "Single",
      birth_date: formData.birth_date || "",
      religion: formData.religion || "",
      address: formData.address || ""
    } 
  })

  const selectedGender = watch("gender")
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
      for (let i = 0; i < 40; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
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
        if (dist < 120) {
          ctx.beginPath();
          ctx.lineWidth = 0.8;
          ctx.strokeStyle = `rgba(59, 130, 246, ${1 - dist / 120})`;
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
    if (!data.gender) {
      toast.error("Protocol Error: Selection required.")
      return
    }
    updateFormData(data)
    setStep(2)
    toast.success("Identity Sequence Synchronized")
  }

  // UPDATED: Muted darker highlights + Intense Glow Tracer on Focus
  const getFieldClassName = (fieldName: string, isTextArea = false) => {
    const value = (allValues as any)[fieldName];
    const hasError = (errors as any)[fieldName];
    const isNotEmpty = value && value.toString().trim() !== "";

    return cn(
      isTextArea ? "w-full min-h-[120px] p-4 pl-12" : "h-12 md:h-14 rounded-2xl",
      "border-2 transition-all duration-300 font-bold outline-none text-white",
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      
      {/* SECTION HEADER */}
      <div className="bg-blue-600/10 rounded-[32px] p-6 border border-blue-500/20 text-white flex items-center gap-5 shadow-2xl relative overflow-hidden group">
        <canvas ref={headerCanvasRef} className="absolute inset-0 pointer-events-auto z-0" />
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0 relative z-10 shadow-lg shadow-blue-500/20">
          <User className="text-white w-7 h-7" />
        </div>
        <div className="relative z-10">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-400 mb-1">Step 01</p>
          <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase italic text-white leading-none">Personal Identity</h2>
        </div>
      </div>

      {/* NAME MATRIX */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {["first_name", "middle_name", "last_name"].map((field) => (
          <div key={field} className="space-y-2">
            <Label className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-500 ml-2">
              {field.replace('_', ' ')} *
            </Label>
            <Input 
              {...register(field as any, { 
                required: true,
                onChange: (e) => {
                  // Allow only letters/spaces and force Title Case
                  const val = e.target.value.replace(/[^a-zA-Z\s]/g, '').replace(/\b\w/g, (c: string) => c.toUpperCase());
                  setValue(field as any, val);
                }
              })} 
              placeholder={
                field === "first_name" ? "Juan" : 
                field === "middle_name" ? "Protacio" : "Dela Cruz"
              } 
              className={getFieldClassName(field)} 
            />
          </div>
        ))}
      </div>

      {/* GENDER SELECTION */}
      <div className="space-y-4">
        <Label className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] ml-2 text-center block">Gender *</Label>
        <div className="flex flex-col sm:flex-row gap-5">
          
          <button
            type="button"
            onClick={() => { setValue("gender", "Male"); updateFormData({ gender: "Male" }); }}
            className={cn(
              "flex-1 flex items-center justify-between px-8 py-6 rounded-[32px] border-2 transition-all duration-500 active:scale-[0.95] relative overflow-hidden",
              selectedGender === "Male" 
                ? "border-blue-900/80 bg-blue-900/40 text-white shadow-[0_0_25px_rgba(30,58,138,0.3)]" 
                : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10"
            )}
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                selectedGender === 'Male' ? "border-blue-400 bg-blue-400/20" : "border-slate-700"
              )}>
                {selectedGender === 'Male' && <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
              </div>
              <span className="font-black uppercase text-xs tracking-[0.2em]">Male</span>
            </div>
            <User size={22} className={cn("relative z-10", selectedGender === 'Male' ? "text-blue-400" : "text-slate-700")} />
          </button>

          <button
            type="button"
            onClick={() => { setValue("gender", "Female"); updateFormData({ gender: "Female" }); }}
            className={cn(
              "flex-1 flex items-center justify-between px-8 py-6 rounded-[32px] border-2 transition-all duration-500 active:scale-[0.95] relative overflow-hidden",
              selectedGender === "Female" 
                ? "border-pink-900/80 bg-pink-900/30 text-white shadow-[0_0_25px_rgba(157,23,77,0.2)]" 
                : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10"
            )}
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                selectedGender === 'Female' ? "border-pink-400 bg-pink-400/20" : "border-slate-700"
              )}>
                {selectedGender === 'Female' && <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />}
              </div>
              <span className="font-black uppercase text-xs tracking-[0.2em]">Female</span>
            </div>
            <User size={22} className={cn("relative z-10", selectedGender === 'Female' ? "text-pink-400" : "text-slate-700")} />
          </button>

        </div>
      </div>

      {/* BIRTHDATE & RELIGION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-500 ml-2">Birth Date *</Label>
          <div className="relative group">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-700 transition-colors group-focus-within:text-blue-400" />
            <Input {...register("birth_date", { required: true })} type="date" className={cn("pl-12 [color-scheme:dark]", getFieldClassName("birth_date"))} />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-500 ml-2">Religion *</Label>
          <div className="relative group">
            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-700 transition-colors group-focus-within:text-blue-400" />
            <Input {...register("religion", { required: true })} placeholder="..." className={cn("pl-12", getFieldClassName("religion"))} />
          </div>
        </div>
      </div>

      {/* AGE & CIVIL STATUS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-500 ml-2">Age *</Label>
          <Input {...register("age", { required: true, min: 12 })} type="number" placeholder="18" className={getFieldClassName("age")} />
        </div>
        <div className="space-y-2">
          <Label className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-500 ml-2">Social Matrix *</Label>
          <div className="relative group">
            <Heart className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-700 transition-colors group-focus-within:text-blue-400" />
            <select 
              {...register("civil_status", { required: true })}
              className={cn("pl-12 pr-10 appearance-none cursor-pointer w-full text-white", getFieldClassName("civil_status"))}
            >
              <option value="Single" className="bg-slate-950">Single</option>
              <option value="Married" className="bg-slate-950">Married</option>
              <option value="Separated" className="bg-slate-950">Separated</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ADDRESS & EMAIL */}
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-500 ml-2">Home Address *</Label>
          <div className="relative group">
            <MapPin className="absolute left-4 top-5 w-4 h-4 text-blue-700 transition-colors group-focus-within:text-blue-400" />
            <textarea {...register("address", { required: true })} placeholder="2049 Alonzo St, Tondo Manila" className={getFieldClassName("address", true)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-500 ml-2">Email *</Label>
          <Input {...register("email", { required: true })} type="email" placeholder="Student@gmail.com" className={getFieldClassName("email")} />
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="pt-10">
        <Button 
          type="submit" 
          className="w-full h-16 md:h-20 rounded-[32px] bg-blue-600 hover:bg-white hover:text-blue-600 text-white shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all duration-500 active:scale-95 flex items-center justify-center gap-4 group"
        >
          <span className="font-black uppercase text-sm tracking-[0.4em] ml-4 text-white group-hover:text-blue-600">Proceed To Step 02</span>
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-all">
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Button>
      </div>
    </form>
  )
}