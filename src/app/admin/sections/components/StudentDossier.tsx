import { memo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  User, Mail, Phone, MapPin, ShieldCheck, 
  GraduationCap, ScrollText, FileText, ZoomIn, 
  X, Globe, Heart, Calendar, Fingerprint,
  Copy, Check
} from "lucide-react"
import { toast } from "sonner"

// ===== STATUS BADGE =====
const StatusBadge = memo(function StatusBadge({ status, isDarkMode }: { status: string, isDarkMode: boolean }) {
  const styles: any = { 
    Pending: isDarkMode ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-600 border-amber-200", 
    Accepted: isDarkMode ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-green-50 text-green-600 border-green-200", 
    Approved: isDarkMode ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-green-50 text-green-600 border-green-200", 
    Rejected: isDarkMode ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-red-50 text-red-600 border-red-200" 
  }
  
  return (
    <div className={`mt-4 md:mt-6 px-4 md:px-6 py-2 rounded-full border text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] w-fit shadow-sm transition-all duration-500 ${styles[status]}`}>
      {status === 'Approved' ? 'Accepted' : status}
    </div>
  )
})

// ===== INFO BLOCK =====
const InfoBlock = memo(function InfoBlock({ label, value, icon, isDarkMode }: { label: string, value: string, icon?: React.ReactNode, isDarkMode: boolean }) {
  return (
    <div className="group transition-all duration-300">
      <p className={`text-[9px] md:text-[10px] uppercase font-black tracking-[0.2em] mb-1.5 transition-colors ${isDarkMode ? 'text-slate-500 group-hover:text-blue-400' : 'text-slate-400 group-hover:text-blue-600'}`}>{label}</p>
      <div className="flex items-center gap-2.5">
        {icon && <span className={`shrink-0 ${isDarkMode ? 'text-blue-400/30' : 'text-blue-500/40'}`}>{icon}</span>}
        <p className={`font-bold text-sm md:text-base break-words leading-tight transition-colors duration-500 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
          {value || "—"}
        </p>
      </div>
    </div>
  )
})

// ===== CREDENTIAL CARD =====
const CredentialCard = memo(function CredentialCard({ label, url, onOpen, isDarkMode }: { label: string, url: string, onOpen?: (url: string, label: string) => void, isDarkMode: boolean }) {
  if (!url) return (
    <div 
      className={`p-4 md:p-6 rounded-[24px] border border-dashed opacity-40 flex flex-col items-center justify-center text-slate-400 h-32 md:h-40 transition-colors duration-500 ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
    >
      <FileText size={20} className="mb-2 opacity-50" />
      <p className="text-[8px] font-black uppercase tracking-widest text-center leading-none">{label}</p>
    </div>
  )
  
  return (
    <div 
      onClick={(e) => { e.stopPropagation(); onOpen && onOpen(url, label); }} 
      className="cursor-pointer group relative"
    >
      <div 
        className={`p-2 rounded-[24px] border hover:border-blue-400 hover:shadow-2xl transition-all h-full relative overflow-hidden duration-500 ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`} 
      >
        <div className={`h-28 md:h-32 rounded-[18px] overflow-hidden relative transition-colors duration-500 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
          {url.toLowerCase().endsWith('.pdf') ? (
            <div className={`w-full h-full flex flex-col items-center justify-center ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
              <FileText size={32} className="text-slate-400" />
              <p className="text-[8px] font-black uppercase text-slate-500 mt-2">PDF Document</p>
            </div>
          ) : (
            <img 
              src={url} 
              alt={label} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
            />
          )}
          <div className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
            <ZoomIn className="text-white drop-shadow-md" size={24} />
          </div>
        </div>
        <p className={`text-[10px] font-black text-center mt-3 uppercase tracking-widest leading-tight px-1 truncate transition-colors duration-500 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
          {label}
        </p>
      </div>
    </div>
  )
})

export const StudentDossier = memo(function StudentDossier({ 
  student, 
  onOpenFile, 
  isDarkMode,
  onClose
}: { 
  student: any, 
  onOpenFile: (url: string, label: string) => void, 
  isDarkMode: boolean,
  onClose?: () => void
}) {
  const [copied, setCopied] = useState(false);
  const isJHS = student.student_category?.toLowerCase().includes("jhs") || student.student_category === "Standard" || student.student_category === "JHS Graduate"
  const isALS = student.student_category?.toLowerCase().includes("als")
  const badgeColor = isALS ? "bg-orange-500" : "bg-blue-600"

  const handleCopyInfo = () => {
    const infoText = `
REGISTRY RECORD
Name: ${student.first_name} ${student.middle_name || ''} ${student.last_name}
LRN: ${student.lrn}
Gender: ${student.gender}
Email: ${student.email}
Phone: ${student.phone || student.contact_no}
Strand: ${student.strand}
Address: ${student.address}
    `.trim();

    navigator.clipboard.writeText(infoText);
    setCopied(true);
    toast.success("Identity profile copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className={`flex flex-col h-full transition-colors duration-500 ${isDarkMode ? 'bg-slate-950' : 'bg-white'}`}>
      
      {/* 🟢 HEADER SECTION: Darker Greyish Theme */}
      <div className={`p-6 md:p-12 flex flex-col items-center text-center relative overflow-hidden shrink-0 transition-all duration-500 ${
          isDarkMode 
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800' 
          : 'bg-slate-200 border-b border-slate-300'
        }`}>
        
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 dark:opacity-10" />

        {/* ❌ EXIT & COPY BUTTONS */}
        <div className="absolute top-4 left-4 z-30 flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className={`rounded-full transition-all active:scale-90 ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-white/20 hover:bg-white/40 text-slate-900'}`}
          >
            <X size={20} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleCopyInfo} 
            className={`rounded-full transition-all active:scale-90 ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-white/20 hover:bg-white/40 text-slate-900'}`}
          >
            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
          </Button>
        </div>

        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-20">
          <Badge className={`${badgeColor} backdrop-blur-md text-white text-[9px] md:text-[10px] font-black px-3 md:px-5 py-2 md:py-2.5 uppercase tracking-widest border-none shadow-xl transition-all`}>
            {student.student_category || "Regular"}
          </Badge>
        </div>

        {/* 🟢 PROFILE IMAGE */}
        <div className="relative z-10 mb-4 md:mb-8 scale-90 md:scale-100">
          <div 
            className={`w-36 h-36 md:w-48 md:h-48 rounded-[40px] md:rounded-[56px] border-[6px] overflow-hidden shadow-2xl flex items-center justify-center cursor-zoom-in group transition-all duration-500 hover:rotate-2 ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-300 border-white'
            }`}
            onClick={(e) => { 
              e.stopPropagation(); 
              const imgUrl = student.profile_picture || student.two_by_two_url || student.profile_2x2_url;
              if (imgUrl) onOpenFile(imgUrl, "Registry Identity Matrix 2x2"); 
            }}
          >
            {student.profile_picture || student.two_by_two_url || student.profile_2x2_url ? (
              <img 
                src={student.profile_picture || student.two_by_two_url || student.profile_2x2_url} 
                alt={`${student.last_name}, ${student.first_name}`} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              />
            ) : (
              <div className={`flex flex-col items-center ${isDarkMode ? 'text-slate-600' : 'text-slate-500'}`}>
                <User size={64} strokeWidth={1} />
                <p className="text-[10px] font-black uppercase mt-3">Identity Missing</p>
              </div>
            )}
          </div>
        </div>

        <h2 className={`relative z-10 text-3xl md:text-5xl font-black tracking-tighter uppercase leading-none italic transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          {student.first_name} {student.last_name}
        </h2>
        
        <div className="flex flex-col items-center gap-2 mt-4 md:mt-6 relative z-10">
            <p className={`font-bold uppercase tracking-[0.4em] text-[10px] md:text-[11px] px-4 py-1.5 rounded-full border backdrop-blur-sm transition-all duration-500 ${isDarkMode ? 'text-slate-300 bg-white/5 border-white/5' : 'text-slate-700 bg-black/5 border-black/10'}`}>
              MATRIX ID: {student.lrn}
            </p>
            <StatusBadge status={student.status} isDarkMode={isDarkMode} />
        </div>
      </div>
      
      {/* 🟢 DATA MATRIX */}
      <div className={`p-6 md:p-12 space-y-12 md:space-y-20 text-sm flex-1 overflow-y-auto no-scrollbar transition-colors duration-500 ${isDarkMode ? 'bg-slate-950' : 'bg-white'}`}>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-20">
          {/* I. PERSONAL IDENTITY */}
          <div className="space-y-8 md:space-y-10">
            <h3 className={`flex items-center gap-3 font-black text-[11px] uppercase tracking-[0.3em] border-b pb-4 transition-colors duration-500 ${isDarkMode ? 'text-blue-400 border-slate-800' : 'text-blue-600 border-slate-200'}`}>
              <User size={16} /> I. Identity Matrix
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-6">
              <InfoBlock label="Given Name" value={student.first_name} isDarkMode={isDarkMode} />
              <InfoBlock label="Middle Initial" value={student.middle_name?.[0] ? `${student.middle_name[0]}.` : "N/A"} isDarkMode={isDarkMode} />
              <InfoBlock label="Surname" value={student.last_name} isDarkMode={isDarkMode} />
              <InfoBlock label="Gender Identity" value={student.gender} isDarkMode={isDarkMode} />
              <InfoBlock label="Religion" value={student.religion} isDarkMode={isDarkMode} />
              <InfoBlock label="Civil Status" value={student.civil_status} isDarkMode={isDarkMode} />
              <InfoBlock label="Nationality" value={student.nationality || "Filipino"} icon={<Globe size={12}/>} isDarkMode={isDarkMode} />
              <InfoBlock label="Current Age" value={student.age?.toString()} icon={<Heart size={12}/>} isDarkMode={isDarkMode} />
              <InfoBlock label="Birth Date" value={student.birth_date} icon={<Calendar size={12}/>} isDarkMode={isDarkMode} />
              <div className="sm:col-span-2">
                <InfoBlock label="Full Legal Registry Name" value={`${student.first_name} ${student.middle_name || ''} ${student.last_name}`} isDarkMode={isDarkMode} />
              </div>
            </div>
          </div>
          
          {/* II. CONNECTIVITY MATRIX */}
          <div className="space-y-8 md:space-y-10">
            <h3 className={`flex items-center gap-3 font-black text-[11px] uppercase tracking-[0.3em] border-b pb-4 transition-colors duration-500 ${isDarkMode ? 'text-indigo-400 border-slate-800' : 'text-indigo-600 border-slate-200'}`}>
              <Mail size={16} /> II. Connectivity Matrix
            </h3>
            <div className="space-y-8">
              <InfoBlock label="Digital Address" value={student.email} icon={<Mail size={12} />} isDarkMode={isDarkMode} />
              <InfoBlock label="Primary Contact" value={student.phone || student.contact_no} icon={<Phone size={12} />} isDarkMode={isDarkMode} />
              <div className="sm:col-span-2">
                <InfoBlock label="Home Residency" value={student.address} icon={<MapPin size={12} />} isDarkMode={isDarkMode} />
              </div>
              <div className={`p-5 rounded-[24px] border shadow-inner transition-colors duration-500 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-1.5">
                   <Fingerprint size={12} className={isDarkMode ? 'text-slate-500' : 'text-slate-400'} />
                   <p className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Registry Node ID</p>
                </div>
                <p className={`text-[11px] font-bold truncate transition-colors duration-500 ${isDarkMode ? 'text-slate-300' : 'text-slate-900'}`}>{student.id}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* III. GUARDIAN & ACADEMIC STANDING */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-20">
           <div className="space-y-8 md:space-y-10">
             <h3 className={`flex items-center gap-3 font-black text-[11px] uppercase tracking-[0.3em] border-b pb-4 transition-colors duration-500 ${isDarkMode ? 'text-emerald-400 border-slate-800' : 'text-emerald-600 border-slate-200'}`}>
               <ShieldCheck size={16} /> III. Guardian Matrix
             </h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
               <InfoBlock label="Legal Guardian Name" value={`${student.guardian_first_name || student.guardian_name || ''} ${student.guardian_last_name || ''}`} isDarkMode={isDarkMode} />
               <InfoBlock label="Emergency Contact" value={student.guardian_phone || student.guardian_contact} icon={<Phone size={12} />} isDarkMode={isDarkMode} />
             </div>
           </div>
           
          <div className="space-y-8 md:space-y-10">
            <h3 className={`flex items-center gap-3 font-black text-[11px] uppercase tracking-[0.3em] border-b pb-4 transition-colors duration-500 ${isDarkMode ? 'text-orange-400 border-slate-800' : 'text-orange-600 border-slate-200'}`}>
              <GraduationCap size={16} /> IV. Academic Standing
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className={`col-span-1 sm:col-span-2 p-6 rounded-[32px] border shadow-sm transition-colors duration-500 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 italic ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Origin Institution</p>
                <p className={`font-black uppercase text-sm md:text-base leading-tight truncate transition-colors duration-500 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                  {student.last_school_attended || "Not Disclosed"}
                </p>
              </div>
              <div className={`p-6 rounded-[32px] border text-center shadow-sm transition-colors duration-500 ${isDarkMode ? 'bg-blue-900/10 border-blue-900/40' : 'bg-blue-50 border-blue-200'}`}>
                <p className={`text-[10px] font-black uppercase mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>GWA Index</p>
                <p className={`text-3xl font-black italic leading-none transition-colors duration-500 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>{student.gwa_grade_10 || "0.00"}</p>
              </div>
              <div className={`p-6 rounded-[32px] border text-center shadow-sm transition-colors duration-500 ${isDarkMode ? 'bg-orange-900/10 border-orange-900/40' : 'bg-orange-50 border-orange-200'}`}>
                <p className={`text-[10px] font-black uppercase mb-2 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>Program Strand</p>
                <p className={`text-2xl md:text-3xl font-black leading-none transition-colors duration-500 ${isDarkMode ? 'text-orange-400' : 'text-orange-700'}`}>{student.strand}</p>
              </div>
              <div className={`col-span-1 sm:col-span-2 p-6 rounded-[32px] border text-center shadow-sm transition-colors duration-500 ${isDarkMode ? 'bg-purple-900/10 border-purple-900/40' : 'bg-purple-50 border-purple-200'}`}>
                <p className={`text-[10px] font-black uppercase mb-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>Assigned Section</p>
                <p className={`text-xl md:text-2xl font-black leading-none transition-colors duration-500 ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>{student.section || "Unassigned"}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* V. CREDENTIAL VAULT */}
        <div className="space-y-8 pb-12">
          <h3 className={`flex items-center gap-3 font-black text-[11px] uppercase tracking-[0.3em] border-b pb-4 transition-colors duration-500 ${isDarkMode ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-200'}`}>
            <ScrollText size={16} /> V. Registrar Vault
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {isJHS ? (
              <>
                <CredentialCard label="Form 138" url={student.form_138_url} onOpen={onOpenFile} isDarkMode={isDarkMode} />
                <CredentialCard label="Good Moral" url={student.good_moral_url} onOpen={onOpenFile} isDarkMode={isDarkMode} />
              </>
            ) : (
              <>
                <CredentialCard label="ALS Rating" url={student.cor_url} onOpen={onOpenFile} isDarkMode={isDarkMode} />
                <CredentialCard label="Diploma" url={student.diploma_url} onOpen={onOpenFile} isDarkMode={isDarkMode} />
                <CredentialCard label="AF5 Form" url={student.af5_url} onOpen={onOpenFile} isDarkMode={isDarkMode} />
              </>
            )}
          </div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 text-center italic mt-6 opacity-60">Institutional Matrix Verification System v2.0</p>
        </div>
      </div>
    </div>
  )
})