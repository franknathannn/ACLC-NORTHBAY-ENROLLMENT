"use client"

import { useEffect, useState, useRef, useCallback } from "react";
import {
  GraduationCap, LayoutDashboard, Users, Settings,
  LogOut, BookOpen, User as UserIcon, Loader2, ShieldCheck, 
  Camera, Sparkles, MessageSquare, ChevronLeft, ChevronRight, Menu, Activity, Sun, Moon
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { themeColors } from "@/lib/themeColors";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [authorized, setAuthorized] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDarkMode, toggleTheme, mounted } = useTheme();
  
  const [adminProfile, setAdminProfile] = useState({
    id: "",
    name: "Loading...",
    email: "",
    avatar: null as string | null
  });

  const fetchAdminIdentity = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user && pathname !== "/admin/login") {
      router.push("/admin/login");
      return;
    }

    if (user) {
      const { data: profile } = await supabase
        .from('admin_profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      setAdminProfile({
        id: user.id,
        name: profile?.full_name || user.email?.split('@')[0] || "Administrator",
        email: user.email || "",
        avatar: profile?.avatar_url || null
      });
      setAuthorized(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchAdminIdentity() }, [fetchAdminIdentity]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const toastId = toast.loading("Processing identity image...");
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${adminProfile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAdminProfile(prev => ({ ...prev, avatar: publicUrl }));
      toast.success("Identity image uploaded.", { id: toastId });
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setUpdating(true);
    const toastId = toast.loading("Synchronizing Matrix...");
    const { error } = await supabase.from('admin_profiles').upsert({
        id: adminProfile.id,
        full_name: adminProfile.name,
        avatar_url: adminProfile.avatar,
        updated_at: new Date().toISOString(),
      });
    if (error) toast.error(error.message, { id: toastId });
    else {
      toast.success("Identity Confirmed & Synced.", { id: toastId });
      fetchAdminIdentity();
    }
    setUpdating(false);
  };

  const handleLogout = async () => {
    const toastId = toast.loading("Terminating session...");
    await supabase.auth.signOut();
    router.refresh(); 
    setTimeout(() => {
      toast.success("Securely Logged Out", { id: toastId });
      router.push("/admin/login");
    }, 800);
  };

  const handleThemeToggle = (mode: 'light' | 'dark') => {
    toggleTheme(mode);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('theme-change', { detail: { mode } }));
    }
  };

  const navigationItems = [
    { href: "/admin/dashboard", icon: <LayoutDashboard size={18} />, label: "Overview" },
    { href: "/admin/applicants", icon: <Users size={18} />, label: "Applicants" },
    { href: "/admin/sections", icon: <BookOpen size={18} />, label: "Sections" },
    { href: "/admin/settings", icon: <Settings size={18} />, label: "Configuration" },
    { href: "/admin/activity_logs", icon: <Activity size={18} />, label: "Matrix Logs" },
    { href: "/admin/communication", icon: <MessageSquare size={18} />, label: "Comms Hub" },
  ];

  if (pathname === "/admin/login") return <>{children}</>;

  if (!authorized) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-slate-950 transition-colors">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Verifying Admin Access</p>
    </div>
  );

  if (!mounted) return null;

  return (
    <div 
      className="flex min-h-screen overflow-x-hidden transition-colors duration-500"
      style={{
        backgroundColor: isDarkMode ? themeColors.dark.background : '#fafafa',
        color: isDarkMode ? themeColors.dark.text.secondary : themeColors.light.text.primary
      }}
    >
      
      {/* DESKTOP SIDEBAR - WHITE IN LIGHT MODE */}
      <aside 
        className={cn(
          "hidden lg:flex flex-col fixed h-full z-40 transition-all duration-500 ease-in-out group",
          "border-r",
          isCollapsed ? "w-20" : "w-72"
        )}
        style={{
          backgroundColor: isDarkMode ? themeColors.dark.surface : themeColors.light.surface,
          borderColor: isDarkMode ? themeColors.dark.border : themeColors.light.border,
          transition: 'all 0.5s ease-in-out'
        }}
      >
        {/* GLOWING ARROW TOGGLE */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "absolute -right-4 top-10 w-8 h-8 rounded-full flex items-center justify-center z-50 shadow-xl transition-all hover:scale-110 active:scale-95",
            "border"
          )}
          style={{
            backgroundColor: isDarkMode ? '#ffffff' : '#000000',
            color: isDarkMode ? '#0f172a' : '#ffffff',
            borderColor: isDarkMode ? themeColors.dark.border : themeColors.light.border
          }}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* TOP BRANDING */}
        <div className="p-6 mb-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
               <div className="absolute inset-0 bg-blue-500 blur-md opacity-0 group-hover:opacity-40 transition-opacity" />
               <img 
                src="/logo-aclc.png" 
                alt="Logo" 
                className="w-10 h-10 object-contain relative z-10 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" 
               />
            </div>
            <div className={cn("flex flex-col transition-all duration-500", isCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible")}>
              <span 
                className="font-black text-sm tracking-widest uppercase leading-none"
                style={{ color: isDarkMode ? themeColors.dark.text.primary : themeColors.light.text.primary }}
              >
                Northbay
              </span>
              <span 
                className="text-[9px] font-bold uppercase tracking-widest mt-1"
                style={{ color: isDarkMode ? themeColors.dark.primary : themeColors.light.primary }}
              >
                Admin Portal
              </span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1.5 relative z-10">
          <p 
            className={cn(
              "text-[9px] font-black uppercase tracking-[0.4em] mb-6 ml-4 transition-all",
              isCollapsed && "opacity-0"
            )}
            style={{ color: isDarkMode ? themeColors.dark.text.muted : themeColors.light.text.muted }}
          >
             Navigation
          </p>
          
          {navigationItems.map((item) => (
            <AdminNavLink key={item.href} {...item} active={pathname === item.href} collapsed={isCollapsed} isDarkMode={isDarkMode} />
          ))}
        </nav>

        {/* BOTTOM USER PROFILE */}
        <div className="p-4 mt-auto space-y-2 relative z-10">
          <div 
            className={cn(
              "rounded-[24px] p-2 flex items-center gap-2 transition-all backdrop-blur-sm border",
              isCollapsed ? "justify-center" : ""
            )}
            style={{
              backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : themeColors.light.surfaceHighlight,
              borderColor: isDarkMode ? themeColors.dark.border : themeColors.light.border
            }}
          >
            {/* THEME TOGGLE */}
            <div 
              className="flex rounded-xl border p-1 shrink-0"
              style={{
                backgroundColor: isDarkMode ? themeColors.dark.background : themeColors.light.background,
                borderColor: isDarkMode ? themeColors.dark.border : themeColors.light.border
              }}
            >
               <button 
                 onClick={() => handleThemeToggle('light')}
                 className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                 style={{
                   backgroundColor: !isDarkMode ? themeColors.light.surface : 'transparent',
                   color: !isDarkMode ? themeColors.light.primary : themeColors.dark.text.muted,
                   boxShadow: !isDarkMode ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none'
                 }}
               >
                  <Sun size={16} className={!isDarkMode ? "fill-blue-600" : ""} />
               </button>
               <button 
                 onClick={() => handleThemeToggle('dark')}
                 className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                 style={{
                   backgroundColor: isDarkMode ? themeColors.dark.surfaceHighlight : 'transparent',
                   color: isDarkMode ? themeColors.dark.primary : themeColors.light.text.muted
                 }}
               >
                  <Moon size={16} className={isDarkMode ? "fill-blue-400" : ""} />
               </button>
            </div>
            
            <div 
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-sm border",
                isCollapsed && "hidden"
              )}
              style={{
                backgroundColor: isDarkMode ? themeColors.dark.background : themeColors.light.background,
                borderColor: isDarkMode ? themeColors.dark.border : themeColors.light.border
              }}
            >
              {adminProfile.avatar ? (
                <img src={adminProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={18} style={{ color: themeColors.light.text.muted }} />
              )}
            </div>
            
            {!isCollapsed && (
              <p 
                className="text-[11px] font-black truncate uppercase tracking-tighter italic animate-in slide-in-from-left-2"
                style={{ color: isDarkMode ? themeColors.dark.text.primary : themeColors.light.text.primary }}
              >
                {adminProfile.name}
              </p>
            )}
          </div>

          <button 
            onClick={handleLogout} 
            className={cn(
              "flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] p-3 rounded-2xl transition-all w-full group",
              isCollapsed ? "justify-center" : ""
            )}
            style={{
              color: isDarkMode ? themeColors.dark.text.muted : themeColors.light.text.secondary,
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(127, 29, 29, 0.2)' : 'rgb(254, 242, 242)';
              e.currentTarget.style.color = isDarkMode ? 'rgb(239, 68, 68)' : 'rgb(220, 38, 38)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = isDarkMode ? themeColors.dark.text.muted : themeColors.light.text.secondary;
            }}
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform shrink-0" /> 
            {!isCollapsed && <span>Terminate</span>}
          </button>
        </div>
      </aside>

      {/* MOBILE NAV OVERLAY */}
      <div 
        className="lg:hidden fixed top-0 left-0 right-0 h-20 backdrop-blur-md border-b z-50 flex items-center justify-between px-6 transition-colors"
        style={{
          backgroundColor: isDarkMode ? 'rgba(2, 6, 23, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          borderColor: isDarkMode ? themeColors.dark.border : themeColors.light.border
        }}
      >
          <div className="flex items-center gap-3">
             <img src="/logo-aclc.png" className="w-8 h-8 object-contain" />
             <span 
               className="font-black text-xs uppercase tracking-widest"
               style={{ color: isDarkMode ? themeColors.dark.text.primary : themeColors.light.text.primary }}
             >
               Northbay Hub
             </span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="p-3 rounded-xl transition-colors"
            style={{
              backgroundColor: isDarkMode ? themeColors.dark.surface : themeColors.light.surface
            }}
          >
             <Menu size={20} style={{ color: isDarkMode ? themeColors.dark.text.primary : themeColors.light.text.primary }} />
          </button>
      </div>

      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent 
            side="left" 
            className="w-80 p-0 border-none"
            style={{
              backgroundColor: isDarkMode ? themeColors.dark.background : '#fafafa'
            }}
          >
             <div className="h-full flex flex-col p-6">
                <SheetHeader className="mb-10 text-left">
                   <div className="flex items-center gap-3 mb-4">
                      <img src="/logo-aclc.png" className="w-10 h-10 object-contain" />
                      <div>
                         <SheetTitle 
                           className="text-2xl font-black uppercase tracking-tighter leading-none"
                           style={{ color: isDarkMode ? themeColors.dark.text.primary : themeColors.light.text.primary }}
                         >
                           Command Hub
                         </SheetTitle>
                         <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-1">Mobile Admin Matrix</p>
                      </div>
                   </div>
                </SheetHeader>
                <nav className="flex-1 space-y-2">
                   {navigationItems.map((item) => (
                      <Link 
                        key={item.href} 
                        href={item.href} 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-4 p-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
                        style={{
                          backgroundColor: pathname === item.href ? themeColors.light.primary : 'transparent',
                          color: pathname === item.href ? themeColors.dark.text.primary : (isDarkMode ? themeColors.dark.text.secondary : themeColors.light.text.muted),
                          boxShadow: pathname === item.href ? '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' : 'none'
                        }}
                      >
                         {item.icon} {item.label}
                      </Link>
                   ))}
                   <button 
                      onClick={() => {
                        handleThemeToggle(isDarkMode ? 'light' : 'dark');
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-4 p-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
                      style={{
                        color: isDarkMode ? themeColors.dark.text.muted : themeColors.light.text.secondary,
                        backgroundColor: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDarkMode ? themeColors.dark.surface : themeColors.light.surfaceHighlight;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                   >
                      {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                      <span>{isDarkMode ? "Switch to Light" : "Switch to Dark"}</span>
                   </button>
                </nav>
                <Button onClick={handleLogout} variant="destructive" className="h-16 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em]">Logout Session</Button>
             </div>
          </SheetContent>
      </Sheet>

      {/* MAIN VIEWPORT */}
      <main className={cn(
        "flex-1 min-h-screen transition-all duration-500 ease-in-out",
        authorized ? (isCollapsed ? "lg:pl-20" : "lg:pl-72") : ""
      )}>
        <header 
          className="hidden lg:flex h-20 backdrop-blur-xl border-b items-center justify-between px-10 sticky top-0 z-30 transition-colors"
          style={{
            backgroundColor: isDarkMode ? 'rgba(2, 6, 23, 0.6)' : 'rgba(255, 255, 255, 0.6)',
            borderColor: isDarkMode ? themeColors.dark.border : themeColors.light.border
          }}
        >
           <div className="flex items-center gap-3">
              <Sparkles className="text-blue-500 animate-pulse" size={16} />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">AMA ACLC - NORTHBAY CAMPUS</p>
           </div>

           <Sheet>
             <SheetTrigger asChild>
               <button 
                 className="flex items-center gap-3 p-2 pr-5 rounded-2xl border hover:shadow-2xl transition-all group"
                 style={{
                   backgroundColor: isDarkMode ? themeColors.dark.surface : themeColors.light.surfaceHighlight,
                   borderColor: isDarkMode ? themeColors.dark.border : themeColors.light.border
                 }}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.backgroundColor = isDarkMode ? themeColors.dark.border : themeColors.light.surface;
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.backgroundColor = isDarkMode ? themeColors.dark.surface : themeColors.light.surfaceHighlight;
                 }}
               >
                  <div 
                    className="w-9 h-9 rounded-xl border overflow-hidden shadow-sm flex items-center justify-center shrink-0 group-hover:border-blue-400"
                    style={{
                      backgroundColor: isDarkMode ? themeColors.dark.background : themeColors.light.background,
                      borderColor: isDarkMode ? themeColors.dark.border : themeColors.light.border
                    }}
                  >
                    {adminProfile.avatar ? <img src={adminProfile.avatar} className="w-full h-full object-cover" /> : <UserIcon size={16} style={{ color: themeColors.light.text.muted }} />}
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <span 
                      className="text-[10px] font-black uppercase tracking-widest leading-none"
                      style={{ color: isDarkMode ? themeColors.dark.text.primary : themeColors.light.text.primary }}
                    >
                      {adminProfile.name}
                    </span>
                    <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest mt-1">Administrator</span>
                  </div>
               </button>
             </SheetTrigger>
             <SheetContent 
               className="w-[400px] sm:w-[500px] p-0 border-none shadow-2xl rounded-l-[40px]"
               style={{
                 backgroundColor: isDarkMode ? themeColors.dark.background : '#fafafa'
               }}
             >
                <div className="h-full flex flex-col">
                  <SheetHeader 
                    className="p-12 text-white relative overflow-hidden"
                    style={{
                      backgroundColor: isDarkMode ? themeColors.dark.surface : 'rgb(30, 58, 138)'
                    }}
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full -mr-20 -mt-20 animate-pulse" />
                    <SheetTitle className="text-5xl font-black uppercase tracking-tighter text-white relative z-10 italic">Profile</SheetTitle>
                    <SheetDescription 
                      className="font-bold uppercase text-[10px] tracking-[0.4em] relative z-10"
                      style={{ color: isDarkMode ? 'rgb(191, 219, 254)' : 'rgb(191, 219, 254)' }}
                    >
                      Credential Override Matrix
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="p-12 space-y-12">
                    <div className="flex flex-col items-center">
                       <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                          <div 
                            className="w-40 h-40 rounded-[56px] border-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden flex items-center justify-center transition-all group-hover:rounded-3xl duration-700"
                            style={{
                              backgroundColor: isDarkMode ? themeColors.dark.surface : themeColors.light.surfaceHighlight,
                              borderColor: isDarkMode ? themeColors.dark.border : themeColors.light.surface
                            }}
                          >
                             {isUploading ? (
                               <Loader2 className="animate-spin text-blue-500" size={32} />
                             ) : adminProfile.avatar ? (
                               <img src={adminProfile.avatar} className="w-full h-full object-cover" />
                             ) : (
                               <UserIcon size={60} style={{ color: 'rgb(203, 213, 225)' }} />
                             )}
                          </div>
                          <div className="absolute bottom-2 right-2 p-4 bg-blue-600 text-white rounded-2xl shadow-xl border-4 border-white transform transition-all group-hover:scale-110 group-hover:rotate-6">
                             <Camera size={20} />
                          </div>
                          <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                       </div>
                    </div>

                    <div className="space-y-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-6 tracking-[0.3em]">Designation Name</label>
                        <Input 
                          value={adminProfile.name} 
                          onChange={(e) => setAdminProfile({...adminProfile, name: e.target.value})} 
                          className="h-16 rounded-[28px] font-black px-8 focus:border-blue-500 transition-all uppercase italic tracking-tighter"
                          style={{
                            backgroundColor: isDarkMode ? themeColors.dark.surface : themeColors.light.surfaceHighlight,
                            borderColor: isDarkMode ? themeColors.dark.border : themeColors.light.border,
                            color: isDarkMode ? themeColors.dark.text.primary : themeColors.light.text.primary
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-6 tracking-[0.3em]">System Address</label>
                        <Input 
                          disabled 
                          value={adminProfile.email} 
                          className="h-16 rounded-[28px] opacity-60 px-8 font-bold text-slate-400"
                          style={{
                            backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : 'rgba(248, 250, 252, 0.5)',
                            borderColor: isDarkMode ? themeColors.dark.border : themeColors.light.border
                          }}
                        />
                      </div>
                    </div>

                    <Button 
                      disabled={updating || isUploading} 
                      onClick={handleUpdateProfile}
                      className="w-full h-20 text-white rounded-[32px] font-black uppercase text-[12px] tracking-[0.3em] shadow-2xl transition-all active:scale-95 group"
                      style={{
                        backgroundColor: isDarkMode ? themeColors.dark.surface : themeColors.light.primary
                      }}
                      onMouseEnter={(e) => {
                        if (!updating && !isUploading) {
                          e.currentTarget.style.backgroundColor = isDarkMode ? themeColors.light.primary : 'rgb(29, 78, 216)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!updating && !isUploading) {
                          e.currentTarget.style.backgroundColor = isDarkMode ? themeColors.dark.surface : themeColors.light.primary;
                        }
                      }}
                    >
                      {updating ? <Loader2 className="animate-spin" /> : <><Sparkles size={20} className="mr-3 group-hover:rotate-12 transition-transform"/> Change Profile</>}
                    </Button>
                  </div>
                </div>
             </SheetContent>
           </Sheet>
        </header>
        
        <div className="pt-24 lg:pt-0 p-4 md:p-12 relative">
           <div className="max-w-7xl mx-auto">
              {children}
           </div>
        </div>
      </main>
    </div>
  );
}

function AdminNavLink({ href, icon, label, active, collapsed, isDarkMode }: { href: string, icon: React.ReactNode, label: string, active: boolean, collapsed: boolean, isDarkMode: boolean }) {
  return (
    <Link 
      href={href} 
      className={cn(
        "flex items-center gap-4 px-5 py-4 rounded-[24px] font-black transition-all duration-500 relative group",
        collapsed ? "justify-center px-0" : ""
      )}
      style={{
        background: active 
          ? (isDarkMode ? 'linear-gradient(to bottom right, rgb(29, 78, 216), rgb(30, 58, 138))' : '#0f172a')
          : 'transparent',
        color: active 
          ? 'rgb(255, 255, 255)' 
          : (isDarkMode ? themeColors.dark.text.muted : themeColors.light.text.secondary),
        border: 'none',
        boxShadow: active 
          ? (isDarkMode ? '0 15px 30px -10px rgba(59, 130, 246, 0.5)' : '0 15px 30px rgba(15, 23, 42, 0.2)')
          : 'none'
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)';
          e.currentTarget.style.color = isDarkMode ? themeColors.dark.primary : themeColors.light.primary;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.color = isDarkMode ? themeColors.dark.text.muted : themeColors.light.text.secondary;
        }
      }}
    >
      <span 
        className="transition-all duration-500"
        style={{
          color: active ? (isDarkMode ? 'rgb(147, 197, 253)' : '#3b82f6') : (isDarkMode ? themeColors.dark.text.muted : themeColors.light.text.secondary),
          transform: active ? 'scale(1.1) rotate(3deg)' : 'scale(1) rotate(0deg)'
        }}
      >
        {icon}
      </span>
      
      {!collapsed && (
        <span className="text-[10px] uppercase tracking-[0.25em] animate-in fade-in slide-in-from-left-2 duration-700">
          {label}
        </span>
      )}

      {active && !collapsed && (
        <div className="absolute right-4 w-1 h-4 bg-blue-400 rounded-full animate-pulse" />
      )}
    </Link>
  );
}