"use client"

import React, { useState, useEffect, useRef } from "react"
import { useEnrollmentStore } from "@/store/useEnrollmentStore"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import { 
  Upload, CheckCircle2, Loader2, ChevronLeft, ChevronRight,
  FileText, Info, Trash2, Search, ShieldCheck, X, Sparkles,
  Maximize2, Orbit
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export default function Step4Documents() {
  const { formData, updateFormData, setStep } = useEnrollmentStore()
  const [loadingField, setLoadingField] = useState<string | null>(null)
  const isJHS = formData.student_category === "JHS Graduate"
  const headerCanvasRef = useRef<HTMLCanvasElement>(null)

  // --- LOCALIZED HEADER CONSTELLATION ---
  useEffect(() => {
    const canvas = headerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let particles: any[] = [];
    const init = () => {
      canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
      for (let i = 0; i < 35; i++) {
        particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, size: Math.random() * 2 });
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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoadingField(field)
    const fileExt = file.name.split('.').pop()
    const fileName = `${formData.lrn || 'student'}_${field}_${Date.now()}.${fileExt}`
    
    try {
      const { data, error } = await supabase.storage
        .from('enrollment-docs')
        .upload(fileName, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('enrollment-docs')
        .getPublicUrl(fileName)

      updateFormData({ [field]: publicUrl })
      toast.success("Document Matrix Synchronized", { icon: <Sparkles className="text-blue-400" /> })
    } catch (error: any) {
      toast.error("Upload failed: " + error.message)
    } finally {
      setLoadingField(null)
    }
  }

  const handleRemove = (field: string) => {
    updateFormData({ [field]: null })
    toast.info("Document Purged from Matrix")
  }

  const UploaderBox = ({ label, field }: { label: string, field: string }) => {
    const currentFileUrl = formData[field as keyof typeof formData] as string | null
    const slotCanvasRef = useRef<HTMLCanvasElement>(null)

    // LOCAL CONSTELLATION EFFECT FOR EMPTY SLOTS
    useEffect(() => {
      if (currentFileUrl || !slotCanvasRef.current) return;
      const canvas = slotCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      let particles: any[] = [];
      const init = () => {
        canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
        for (let i = 0; i < 15; i++) {
          particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2, size: Math.random() * 1.5 });
        }
      };
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
        particles.forEach(p => {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
          if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        });
        requestAnimationFrame(animate);
      };
      init(); animate();
    }, [currentFileUrl]);

    return (
      <div className="space-y-3">
        <Label className="font-black text-slate-500 text-[9px] uppercase tracking-[0.3em] flex items-center gap-2 ml-2">
          {label} {currentFileUrl && <Sparkles className="w-3 h-3 text-blue-500 animate-pulse" />}
        </Label>
        
        <div className={cn(
          "group relative rounded-[32px] overflow-hidden border-2 transition-all duration-500",
          // GLOW TRACER Logic: Blue highlight if uploaded, muted glass if empty
          currentFileUrl ? "border-blue-900/40 shadow-[0_0_30px_rgba(30,58,138,0.2)]" : "border-white/5 hover:border-blue-500/30"
        )}>
          <div className={cn(
            "relative transition-all duration-500 min-h-[220px] flex flex-col items-center justify-center",
            currentFileUrl ? "bg-slate-950/60" : "bg-white/5"
          )}>
            
            {!currentFileUrl && <canvas ref={slotCanvasRef} className="absolute inset-0 pointer-events-none" />}

            {loadingField === field ? (
              <div className="flex flex-col items-center gap-3 relative z-10">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]">Uploading...</span>
              </div>
            ) : currentFileUrl ? (
              <div className="absolute inset-0 w-full h-full">
                <img src={currentFileUrl} alt={label} className="w-full h-full object-cover opacity-50 transition-opacity group-hover:opacity-30" />
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-slate-950/40 backdrop-blur-[2px] p-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="secondary" size="sm" className="w-full max-w-[140px] rounded-2xl font-black text-[10px] uppercase h-11 bg-white text-slate-950 hover:bg-blue-50">
                        <Search className="w-4 h-4 mr-2 text-blue-600" /> Inspect
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl bg-slate-950/95 border-white/10 text-white rounded-[40px]">
                        <DialogHeader>
                          <DialogTitle className="text-white uppercase font-black tracking-widest">{label} Matrix Verification</DialogTitle>
                        </DialogHeader>
                        <div className="flex items-center justify-center p-4 bg-slate-900 rounded-3xl border border-white/5 shadow-2xl">
                           <img src={currentFileUrl} className="max-h-[70vh] object-contain rounded-xl shadow-2xl" />
                        </div>
                    </DialogContent>
                  </Dialog>

                  <Button onClick={() => handleRemove(field)} variant="destructive" size="sm" className="w-full max-w-[140px] rounded-2xl font-black text-[10px] uppercase h-11 bg-red-900/20 text-red-500 border border-red-500/50 hover:bg-red-600 hover:text-white">
                    <Trash2 className="w-4 h-4 mr-2" /> Purge Asset
                  </Button>
                </div>
              </div>
            ) : (
              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-6 z-10 group">
                <input type="file" className="hidden" onChange={(e) => handleUpload(e, field)} accept="image/*" />
                <div className="p-5 bg-blue-600/10 rounded-2xl border border-blue-500/20 mb-4 group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-500">
                   <Upload className="w-6 h-6 text-blue-700 group-hover:text-white" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center group-hover:text-blue-400 transition-colors">
                  Initialize <br/> {label}
                </span>
              </label>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-6 duration-1000 pb-10">
      
      {/* SECTION HEADER: Constellation Engine Applied */}
      <div className="bg-blue-600/10 rounded-[32px] p-6 border border-blue-500/20 text-white flex items-center gap-5 shadow-2xl relative overflow-hidden group">
        <canvas ref={headerCanvasRef} className="absolute inset-0 pointer-events-none opacity-50" />
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0 relative z-10 shadow-lg shadow-blue-500/20">
          <FileText className="text-white w-7 h-7" />
        </div>
        <div className="relative z-10">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-400 mb-1">Step 04</p>
          <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase italic text-white leading-none">Document Application</h2>
        </div>
      </div>

      <div className="p-5 bg-blue-950/40 rounded-[24px] border border-blue-900/30 flex items-center gap-4">
        <ShieldCheck className="w-6 h-6 text-blue-700 shrink-0" />
        <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed text-slate-500">
          Educational validation required. Please use <span className="text-blue-400">JPG, JPEG, or PNG</span> formats only.
        </p>
      </div>

      {/* UPLOAD GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <UploaderBox label="2x2 Identification" field="profile_2x2_url" />

        {isJHS ? (
          <>
            <UploaderBox label="F-138 (Report Card)" field="form_138_url" />
            <UploaderBox label="Certificate of Moral" field="good_moral_url" />
          </>
        ) : (
          <>
            <UploaderBox label="ALS COR" field="cor_url" />
            <UploaderBox label="ALS Diploma" field="diploma_url" />
          </>
        )}
      </div>

      {/* FOOTER ACTIONS */}
      <div className="pt-10 flex flex-col gap-4">
        <Button 
          onClick={() => setStep(5)} 
          disabled={
            !formData.profile_2x2_url || 
            (isJHS 
              ? (!formData.form_138_url || !formData.good_moral_url)
              : (!formData.cor_url || !formData.diploma_url))
          }
          className="h-16 md:h-20 rounded-[32px] bg-blue-600 hover:bg-white hover:text-blue-600 text-white shadow-[0_20px_50px_rgba(59,130,246,0.3)] transition-all duration-500 active:scale-95 flex items-center justify-center gap-4 group disabled:opacity-10"
        >
          <span className="font-black uppercase text-sm tracking-[0.4em] ml-4 text-white group-hover:text-blue-600">Finalize Application</span>
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-all">
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Button>
        
        <button onClick={() => setStep(3)} className="text-slate-600 font-black uppercase text-[9px] tracking-[0.4em] flex items-center justify-center gap-2 hover:text-white transition-colors py-4 group">
          <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Go Back
        </button>
      </div>
    </div>
  )
}