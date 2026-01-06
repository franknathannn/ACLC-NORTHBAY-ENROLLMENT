"use client"

import React, { useEffect, useState, useMemo, useRef } from "react"
import { useEnrollmentStore } from "@/store/useEnrollmentStore"
import { supabase } from "@/lib/supabase/client"
import { Loader2, Lock, Home, Timer, ArrowLeft, Calendar, Users, Activity, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import Step1Identity from "@/components/forms/Step1Identity"
import Step2Academic from "@/components/forms/Step2Academic"
import Step3Family from "@/components/forms/Step3Family"
import Step4Documents from "@/components/forms/Step4Documents"
import Step5Review from "@/components/forms/Step5Review"

export default function EnrollmentPage() {
  const { currentStep } = useEnrollmentStore() 
  const [systemStatus, setSystemStatus] = useState<{ 
    isOpen: boolean; 
    reason: "date" | "manual" | "capacity" | null;
    closingTime: string | null;
    openingTime: string | null;
    schoolYear: string;
    controlMode: string;
  } | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const progressPercentage = (currentStep / 5) * 100

  // --- 1. THE RE-ENGINEERED CONSTELLATION ENGINE ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: {x: number, y: number, vx: number, vy: number, size: number}[] = [];
    let mouse = { x: -1000, y: -1000 };
    let animationId: number;

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      // Increased density for immediate visibility
      const count = Math.floor((canvas.width * canvas.height) / 12000); 
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          size: Math.random() * 2 + 1 // Bigger stars
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Bounce logic
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Draw Star (Brighter White)
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)"; 
        ctx.fill();

        // Cursor Connection
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 220) {
          ctx.beginPath();
          ctx.lineWidth = 1.5;
          // Ultra-Vivid Blue Connection
          ctx.strokeStyle = `rgba(59, 130, 246, ${1 - dist / 220})`;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      });
      animationId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", init);
    
    init();
    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", init);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // --- DATABASE LOGIC (STRICTLY RETAINED) ---
  async function checkStatus() {
    try {
      const [configRes, countRes] = await Promise.all([
        supabase.from('system_config').select('*').single(),
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'Accepted')
      ])
      if (configRes.error) throw configRes.error
      const config = configRes.data
      const currentEnrolled = countRes.count || 0
      if (config) {
        const now = new Date();
        const start = config.enrollment_start ? new Date(config.enrollment_start) : null;
        const end = config.enrollment_end ? new Date(config.enrollment_end) : null;
        const isFull = currentEnrolled >= config.capacity;
        let portalOpen = false;
        let closeReason: any = null;

        if (isFull) { portalOpen = false; closeReason = "capacity"; } 
        else if (config.control_mode === 'manual') { 
          portalOpen = config.is_portal_active; 
          closeReason = !config.is_portal_active ? "manual" : null; 
        } else {
          const hasDates = config.enrollment_start && config.enrollment_end;
          const isWithinWindow = hasDates && (now >= start! && now <= end!);
          portalOpen = isWithinWindow;
          closeReason = !isWithinWindow ? "date" : null;
        }

        setSystemStatus({ 
          isOpen: portalOpen, reason: closeReason, closingTime: config.enrollment_end, 
          openingTime: config.enrollment_start, schoolYear: config.school_year || "2025-2026", 
          controlMode: config.control_mode || "automatic" 
        })
      }
    } catch (error) { console.error("Portal verification failed:", error) } 
    finally { setLoading(false) }
  }

  useEffect(() => { checkStatus(); const interval = setInterval(checkStatus, 60000); return () => clearInterval(interval); }, []);

  useEffect(() => {
    if (!systemStatus?.closingTime || !systemStatus.isOpen || systemStatus.controlMode === 'manual') { setTimeLeft(null); return; }
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(systemStatus.closingTime!).getTime();
      const diff = end - now;
      if (diff <= 0) {
        setSystemStatus(prev => prev ? { ...prev, isOpen: false, reason: "date" } : null);
        setTimeLeft(null);
        clearInterval(timer);
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${h}h ${m}m ${s}s`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [systemStatus]);

  const currentStepContent = useMemo(() => {
    switch (currentStep) {
      case 1: return <Step1Identity />;
      case 2: return <Step2Academic />;
      case 3: return <Step3Family />;
      case 4: return <Step4Documents />;
      case 5: return <Step5Review />;
      default: return <Step1Identity />;
    }
  }, [currentStep]);

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
      <p className="text-blue-400 font-black text-[10px] uppercase tracking-[0.4em]">Initializing Admission Matrix...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#020617] p-6 md:p-12 overflow-x-hidden relative text-white">
      {/* CANVAS BACKGROUND - FORCED TO BACK */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 block" style={{ background: 'transparent' }} />
      
      {/* AMBIENT GLOWS */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none z-0" />

      {!systemStatus?.isOpen ? (
        <div className="max-w-md mx-auto mt-32 space-y-10 relative z-10 text-center animate-in fade-in duration-1000">
           <div className="relative group mx-auto w-24 h-24">
              <div className="absolute inset-0 bg-blue-600/20 blur-xl rounded-full animate-pulse" />
              <div className="relative w-full h-full bg-slate-900 border border-white/10 rounded-[32px] flex items-center justify-center">
                 {systemStatus?.reason === "capacity" ? <Users size={40} className="text-amber-500" /> : <Lock size={40} className="text-blue-500" />}
              </div>
           </div>
           <h1 className="text-4xl font-black uppercase tracking-tighter italic">
             {systemStatus?.reason === "date" ? "Portal is now Officially Closed" : "Portal Encrypted"}
           </h1>
           {systemStatus?.reason === "date" ? (
             <div className="w-full space-y-4">
               <Button disabled className="w-full h-16 rounded-2xl bg-slate-800 text-slate-500 font-black uppercase tracking-widest border border-white/10 opacity-50 cursor-not-allowed">
                 <Lock className="mr-2" size={18} /> APPLICATION CLOSED
               </Button>
               <Link href="/" className="block"><Button variant="ghost" className="w-full rounded-xl text-slate-500 font-bold uppercase text-xs tracking-widest hover:text-white hover:bg-white/5">Return to Hub</Button></Link>
             </div>
           ) : (
             <Link href="/"><Button className="w-full h-16 rounded-2xl bg-white text-slate-950 font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">Return to Hub</Button></Link>
           )}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-8 relative z-10">
          
          {/* HEADER NAV */}
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="rounded-xl font-black uppercase text-[9px] tracking-[0.2em] text-slate-500 hover:text-white hover:bg-white/5">
                <ArrowLeft className="mr-2" size={14}/> Go Back to Homepage
              </Button>
            </Link>
            {timeLeft && (
              <div className="bg-slate-900/50 border border-white/5 px-5 py-2.5 rounded-full flex items-center gap-3 backdrop-blur-md shadow-xl">
                <Timer size={14} className="text-blue-400 animate-pulse" />
                <span className="font-mono font-black text-xs text-blue-400">{timeLeft}</span>
              </div>
            )}
          </div>

          {/* BRANDING HUB */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5 group">
               <div className="relative flex items-center justify-center p-1.5">
                  <div className="absolute inset-0 bg-blue-600/30 blur-xl rounded-full animate-pulse group-hover:bg-blue-500/50 transition-all" />
                  <img src="/logo-aclc.png" alt="Logo" className="relative w-14 h-14 object-contain drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
               </div>
               <div className="flex flex-col">
                 <span className="font-black text-xl uppercase italic leading-none tracking-tighter text-white">AMA ACLC Northbay</span>
                 <span className="text-[9px] font-bold text-blue-400 uppercase tracking-[0.4em] mt-1.5">Enrollment System</span>
               </div>
            </div>
            <div className="flex flex-col items-end gap-2">
               <div className="px-5 py-2 bg-blue-600 rounded-2xl border border-blue-400/30 shadow-[0_0_20px_rgba(37,99,235,0.3)] font-black text-[10px] text-white uppercase tracking-widest">
                  Step 0{currentStep}
               </div>
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">{progressPercentage}% Sync</span>
            </div>
          </div>

          {/* PROGRESS LINE */}
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-gradient-to-r from-blue-700 via-blue-400 to-white transition-all duration-1000 ease-out" style={{ width: `${progressPercentage}%` }} />
          </div>

          {/* THE DARK MATRIX FORM CONTAINER */}
          <div className="bg-slate-950/80 backdrop-blur-3xl p-8 md:p-12 rounded-[56px] shadow-[0_40px_80px_-15px_rgba(0,0,0,1)] border border-white/10 animate-in slide-in-from-bottom-4 duration-1000 relative overflow-hidden group">
            <ShieldCheck size={200} className="absolute -bottom-20 -right-20 text-white/[0.02] -rotate-12 pointer-events-none" />
            <div className="relative z-10">
               {currentStepContent}
            </div>
          </div>

          {/* STEP INDICATORS */}
          <div className="flex justify-center gap-4 py-4">
            {[1,2,3,4,5].map((s) => (
              <div key={s} className={cn(
                "h-1.5 rounded-full transition-all duration-700",
                s === currentStep ? "w-12 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]" : s < currentStep ? "w-3 bg-blue-950" : "w-2 bg-white/10"
              )} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}