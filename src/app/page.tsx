"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { 
  ArrowRight, Search, Activity, Cpu, 
  BookOpen, Calendar, ChevronRight, Zap, 
  ShieldCheck, Target, Users2, Sparkles, Orbit,
  CheckCircle2, MapPin, Facebook, Globe, GraduationCap, Lock
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function HomePage() {
  const [config, setConfig] = useState<any>(null)
  const [stats, setStats] = useState({ 
    totalCount: 0, totalMax: 0,
    ictCount: 0, ictMax: 0,
    gasCount: 0, gasMax: 0 
  })
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // --- 1. DYNAMIC DATABASE SLOTS LOGIC (LOAD INDEX SYNC) ---
  const fetchDatabaseStats = useCallback(async () => {
    try {
      const { data: configData } = await supabase.from('system_config').select('*').single();
      if (configData) setConfig(configData);

      const [sectionsRes, studentsRes] = await Promise.all([
        supabase.from('sections').select('strand, capacity'),
        supabase.from('students').select('status, strand')
      ]);

      const sections = sectionsRes.data || [];
      const students = studentsRes.data || [];
      const activeStudents = students.filter(s => s.status === 'Accepted' || s.status === 'Approved');

      const ictMax = sections.filter(s => s.strand === 'ICT').reduce((sum, s) => sum + (s.capacity || 40), 0);
      const ictCount = activeStudents.filter(s => s.strand === 'ICT').length;

      const gasMax = sections.filter(s => s.strand === 'GAS').reduce((sum, s) => sum + (s.capacity || 40), 0);
      const gasCount = activeStudents.filter(s => s.strand === 'GAS').length;

      setStats({
        totalCount: ictCount + gasCount,
        totalMax: ictMax + gasMax,
        ictCount,
        ictMax,
        gasCount,
        gasMax
      });
    } catch (error) {
      console.error("Matrix Sync Error:", error);
    }
  }, []);

  useEffect(() => {
    fetchDatabaseStats();
    const channel = supabase.channel('matrix-live-home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => fetchDatabaseStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sections' }, () => fetchDatabaseStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_config' }, () => fetchDatabaseStats())
      .subscribe();

    // Fallback polling (2s) to ensure data consistency if sockets fail
    const interval = setInterval(fetchDatabaseStats, 2000);

    return () => { 
      supabase.removeChannel(channel); 
      clearInterval(interval);
    };
  }, [fetchDatabaseStats]);

  // --- 2. THE DAVINCI CONSTELLATION ENGINE ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let particles: any[] = [];
    const mouse = { x: -1000, y: -1000 };
    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      for (let i = 0; i < 85; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          size: Math.random() * 2 + 1
        });
      }
    };
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        const dx = mouse.x - p.x; const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          ctx.beginPath(); ctx.lineWidth = 0.8;
          ctx.strokeStyle = `rgba(59, 130, 246, ${1 - dist / 180})`;
          ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      });
      requestAnimationFrame(animate);
    };
    const handleMouseMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", init);
    init(); animate();
    return () => { window.removeEventListener("resize", init); window.removeEventListener("mousemove", handleMouseMove); };
  }, []);

  const isManual = config?.control_mode === 'manual';
  const now = new Date();
  const start = config?.enrollment_start ? new Date(config.enrollment_start) : null;
  const end = config?.enrollment_end ? new Date(config.enrollment_end) : null;
  const isExpired = !isManual && end && now > end;
  
  const isPortalActive = isManual ? config?.is_portal_active : (start && end && now >= start && now <= end);

  const getEnrollmentStatusText = () => {
    if (isManual) return isPortalActive ? "Enrollment Form is Open" : "System Lockdown";
    if (isExpired) return "Portal is Expired";
    if (isPortalActive && config?.enrollment_start && config?.enrollment_end) {
      const start = new Date(config.enrollment_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const end = new Date(config.enrollment_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${start} — ${end}`;
    }
    return "Admissions Offline";
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden relative">
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* NAVIGATION BAR */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/60 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-6 group cursor-pointer">
            <div className="relative flex items-center justify-center p-2">
               <div className="absolute inset-0 bg-blue-600/40 blur-[25px] rounded-full animate-pulse group-hover:bg-blue-500/60 transition-all duration-700" />
               <img src="/logo-aclc.png" alt="ACLC Logo" className="relative w-16 h-16 object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.8)] group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-2xl tracking-tighter uppercase leading-none italic text-white drop-shadow-md">ACLC</span>
              <span className="text-[9px] font-bold tracking-[0.5em] text-blue-400 uppercase leading-none mt-1 shadow-blue-900">Northbay Campus</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Badge className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-4 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest">
               S.Y. {config?.school_year || "2025-2026"}
            </Badge>
          </div>
        </div>
      </nav>

      <main className="pt-48 pb-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            
            {/* HERO SECTION */}
            <div className="lg:col-span-7 space-y-12">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <div className="px-3 py-1 bg-blue-700 rounded-md text-[10px] font-black uppercase tracking-tighter text-white">Educational Portal</div>
                   <div className="h-[1px] w-12 bg-white/20" />
                </div>
                <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.8] uppercase">
                  Start Your <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-100 to-indigo-500 animate-pulse">Destiny</span>.
                </h1>
                <p className="text-xl text-slate-400 font-medium max-w-xl leading-relaxed italic border-l-2 border-blue-700 pl-6">
                  "Simplicity is the ultimate sophistication." Join the intellectual constellation at ACLC Northbay Tondo.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-5">
                {isPortalActive ? (
                  <Link href="/enroll">
                    <Button className="h-20 px-12 rounded-[32px] bg-blue-700 hover:bg-blue-600 text-white font-black uppercase text-xs tracking-[0.3em] shadow-[0_20px_60px_rgba(29,78,216,0.4)] transition-all hover:-translate-y-2 active:scale-95 group">
                      Proceed to Enrollment <ArrowRight className="ml-4 group-hover:translate-x-2 transition-transform text-white" />
                    </Button>
                  </Link>
                ) : (
                  <Button disabled className="h-20 px-12 rounded-[32px] bg-slate-900/50 text-slate-600 font-black uppercase text-xs tracking-widest border border-white/5 cursor-not-allowed">
                    {isExpired ? <><Lock className="mr-2" size={18}/> Portal Expired</> : "Enrollment Access Locked"}
                  </Button>
                )}
                <Link href="/status">
                   <Button variant="outline" className="h-20 px-12 rounded-[32px] border-white/20 bg-white/5 font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all text-white backdrop-blur-xl">
                    Track Status
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-4 pt-8">
                 <div className="px-6 py-4 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md flex items-center gap-3">
                    <Users2 className="text-blue-500" size={18} />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                      <span className="text-blue-400">{stats.totalCount}</span> Confirmed Registrants
                    </p>
                 </div>
              </div>
            </div>

            {/* STATUS CARD */}
            <div className="lg:col-span-5 relative">
              <div className="absolute -inset-1 bg-blue-600/20 rounded-[50px] blur-2xl animate-pulse"></div>
              <Card className="relative p-10 rounded-[56px] border border-white/20 bg-blue-950/40 backdrop-blur-3xl space-y-10 overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between relative z-10">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black uppercase tracking-tighter text-white italic">Strand Distribution</h3>
                    <p className="text-[8px] font-bold text-blue-400 uppercase tracking-[0.5em]">Real-time Academic Tracker</p>
                  </div>
                  <Target className="text-white animate-pulse" size={24} />
                </div>

                <div className="space-y-10 relative z-10">
                   <CapacityBar label="ICT Division" current={stats.ictCount} max={stats.ictMax} />
                   <CapacityBar label="GAS Division" current={stats.gasCount} max={stats.gasMax} />
                   
                   <div className="p-6 bg-blue-700/80 rounded-[32px] text-white flex items-center justify-between border border-white/20 shadow-inner">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-80 mb-1 text-white uppercase">Global Vacancies</p>
                        <p className="text-5xl font-black tracking-tighter text-white leading-none">
                          {stats.totalMax - stats.totalCount}
                        </p>
                      </div>
                      <div className="text-right">
                         <Orbit size={40} className="text-white/20 animate-spin" style={{ animationDuration: '10s' }} />
                      </div>
                   </div>
                </div>

                <div className="pt-6 flex items-center gap-5 border-t border-white/5">
                   <div className={`p-4 rounded-2xl ${isPortalActive ? 'bg-white text-blue-900 shadow-lg' : 'bg-slate-800 text-slate-500'}`}>
                      {isManual ? <Zap size={22} /> : <Calendar size={22} />}
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Application Window</p>
                      <p className={`text-sm font-black uppercase tracking-tighter ${isPortalActive ? 'text-white' : 'text-red-500'}`}>
                        {getEnrollmentStatusText()}
                      </p>
                   </div>
                </div>
              </Card>
            </div>
          </div>

          {/* 3. NEW SECTION: ACADEMIC STRANDS SCROLL */}
          <div className="mt-40 space-y-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-[1px] bg-blue-600" />
              <h2 className="text-4xl font-black uppercase tracking-tighter italic">Available Strands</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* ICT CARD */}
              <Card className="group relative p-10 rounded-[48px] bg-white/5 border border-white/10 backdrop-blur-md overflow-hidden hover:border-blue-500/50 transition-all duration-500">
                <div className="absolute -right-10 -top-10 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Cpu size={200} className="text-blue-500" />
                </div>
                <div className="relative z-10 space-y-6">
                  <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
                    <Cpu size={28} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter">Information & Communication Technology</h3>
                    <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Specialized Tech Curriculum</p>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    Master the digital landscape with heavy focus on computer programming, systems analysis, and visual graphics. 
                  </p>
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest leading-relaxed">
                      ACLC Northbay is the regional leader in ICT, boasting 100% computerized modules and industry-aligned software training that ensures students are career-ready upon graduation.
                    </p>
                  </div>
                </div>
              </Card>

              {/* GAS CARD */}
              <Card className="group relative p-10 rounded-[48px] bg-white/5 border border-white/10 backdrop-blur-md overflow-hidden hover:border-indigo-500/50 transition-all duration-500">
                <div className="absolute -right-10 -top-10 opacity-10 group-hover:opacity-20 transition-opacity">
                  <BookOpen size={200} className="text-indigo-500" />
                </div>
                <div className="relative z-10 space-y-6">
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20">
                    <BookOpen size={28} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter">General Academic Strand</h3>
                    <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Versatile Collegiate Prep</p>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    A flexible pathway designed for students exploring various professional fields like business, education, and management.
                  </p>
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest leading-relaxed">
                      Our GAS program is exceptionally solid, integrating "Tech-Humanities" where students learn traditional academic disciplines powered by modern digital research tools.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* 4. NEW SECTION: LEARNING BENEFITS */}
          <div className="mt-40 space-y-16 py-20 bg-blue-600/5 rounded-[64px] border border-blue-600/10 px-10">
            <div className="text-center space-y-4">
              <Badge className="bg-blue-600 text-white font-black px-6 py-2 rounded-full uppercase tracking-widest">Welcome New Enrollees!</Badge>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase">Learning Benefits</h2>
              <div className="flex flex-wrap justify-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">
                <span>Grade 10 Completers</span>
                <span className="text-white/20">•</span>
                <span>ALS Completers</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                "No Top-Up", "No Hidden Fees", "No Entrance Exam", "No Grade Requirements",
                "No Books to Purchase", "Airconditioned Classrooms", "Flexible Learning Schedule", "DepEd Voucher Accepted"
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-4 p-6 bg-slate-900 rounded-[32px] border border-white/5 group hover:bg-blue-700 transition-colors duration-300">
                  <CheckCircle2 className="text-blue-500 group-hover:text-white shrink-0" size={24} />
                  <span className="text-[11px] font-black uppercase tracking-widest leading-tight">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* 5. NEW INSTITUTIONAL HUB FOOTER */}
      <footer className="mt-40 border-t border-white/5 bg-slate-950/80 backdrop-blur-3xl py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 items-start">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Orbit className="text-blue-500" size={40} />
                <div>
                  <h4 className="font-black uppercase text-xl italic leading-none">ACLC Northbay</h4>
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.5em] mt-2">Institutional Hub</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Part of the AMA Education System, providing quality technology-driven education in the heart of Tondo, Manila.
              </p>
            </div>

            <div className="space-y-6">
              <h5 className="font-black uppercase text-[10px] tracking-[0.4em] text-blue-500">Contact Matrix</h5>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <MapPin className="text-slate-500 shrink-0 mt-1" size={18} />
                  <p className="text-[11px] font-bold text-slate-300 leading-relaxed uppercase tracking-wider">
                    2nd/3rd floor MTSC Bldg Juan Luna Cor. Capulong Street, Tondo Manila
                  </p>
                </li>
                <li>
                  <a href="https://www.facebook.com/Northbaycampus" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group">
                    <Facebook className="text-slate-500 group-hover:text-blue-500 transition-colors" size={18} />
                    <span className="text-[11px] font-bold text-slate-300 group-hover:text-white transition-colors uppercase tracking-widest">/Northbaycampus</span>
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-6">
              <h5 className="font-black uppercase text-[10px] tracking-[0.4em] text-blue-500">System Identity</h5>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center gap-4">
                 <ShieldCheck size={28} className="text-blue-500" />
                 <div>
                    <p className="text-[9px] font-black text-white uppercase tracking-widest">Secure Registry</p>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">AES-256 Encrypted Portal</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">© 2025 AMA Education System </p>
            <div className="flex items-center gap-4 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
              <GraduationCap size={16} />
              <Globe size={16} />
              <Activity size={16} />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CapacityBar({ label, current, max }: any) {
  const percentage = max > 0 ? (current / max) * 100 : 0;
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{label}</p>
        <p className="text-xs font-black text-white">{current} <span className="text-blue-400/60">/ {max} Seats</span></p>
      </div>
      <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/10">
        <div 
          className="h-full rounded-full bg-gradient-to-r from-blue-700 via-blue-500 to-white transition-all duration-[2000ms] ease-out shadow-[0_0_15px_rgba(59,130,246,0.6)]" 
          style={{ width: `${percentage}%` }} 
        />
      </div>
    </div>
  );
}