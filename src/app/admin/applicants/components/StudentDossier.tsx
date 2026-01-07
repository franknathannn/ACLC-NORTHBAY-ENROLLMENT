// src/app/admin/applicants/components/StudentDossier.tsx

import { memo } from "react"
import { Badge } from "@/components/ui/badge"
import { 
 User, Phone, GraduationCap, ShieldCheck, ScrollText, Mail, MapPin
} from "lucide-react"
import { InfoBlock } from "./InfoBlock"
import { CredentialCard } from "./CredentialCard"
import { StatusBadge } from "./StatusBadge"

export const StudentDossier = memo(({ student, onOpenFile, isDarkMode }: { student: any, onOpenFile: (url: string, label: string) => void, isDarkMode: boolean }) => {
 const isJHS = student.student_category?.toLowerCase().includes("jhs") || student.student_category === "Standard";
 const isALS = student.student_category?.toLowerCase().includes("als");

 const headerColor = isALS ? "bg-gradient-to-br from-orange-500 to-orange-600" : "bg-gradient-to-br from-slate-800 to-slate-900";
 const badgeColor = isALS ? "bg-orange-500" : "bg-blue-600";

 return (
  <div className="flex flex-col">
       <div className={`${headerColor} p-6 md:p-10 flex flex-col items-center text-center relative overflow-hidden transition-colors duration-500`} style={{ background: 'linear-gradient(135deg, #1e3a8a, #0f172a)' }}>
    <div className="absolute top-0 left-0 p-4 md:p-8 flex flex-col gap-2 items-start">
     <Badge className={`${badgeColor} text-white backdrop-blur-md text-[10px] font-black px-3 md:px-4 py-2 uppercase tracking-widest border-none`}>{student.student_category || "Standard"}</Badge>
     <Badge variant="outline" className="text-white/80 border-white/40 text-[9px] uppercase font-bold">{student.school_year}</Badge>
    </div>
    <div className="relative z-10 mb-6">
     <div className="w-32 h-32 md:w-44 md:h-44 bg-slate-800 rounded-3xl border-4 border-white/10 overflow-hidden shadow-2xl flex items-center justify-center cursor-zoom-in group hover:ring-2 hover:ring-blue-400/50 transition-all" onClick={() => onOpenFile(student.two_by_two_url || student.profile_2x2_url || student.profile_picture, "Applicant 2x2 Image")}>
      {student.two_by_two_url || student.profile_2x2_url || student.profile_picture ? (<img src={student.two_by_two_url || student.profile_2x2_url || student.profile_picture} alt="2x2" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="eager" decoding="async" />) : (<div className="flex flex-col items-center text-slate-500"><User size={48} strokeWidth={1} /><p className="text-[8px] font-bold uppercase mt-2">No Photo Provided</p></div>)}
     </div>
    </div>
    <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase leading-none">{student.first_name} {student.last_name}</h2>
    <p className="text-white/80 font-bold uppercase tracking-[0.3em] text-[10px] mt-3">LRN: {student.lrn}</p>
    <StatusBadge status={student.status} isDarkMode={isDarkMode} />
   </div>

   <div className="p-6 md:p-10 space-y-8 md:space-y-12 transition-colors duration-500" style={{ backgroundColor: isDarkMode ? 'rgb(15 23 42)' : '#ffffff' }}>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 text-sm">
     <div className={`space-y-6 p-4 md:p-6 rounded-2xl transition-colors border border-transparent cursor-pointer ${isDarkMode ? 'hover:!bg-slate-800 hover:!border-slate-700' : 'hover:!bg-blue-50 hover:!border-blue-200'}`}>
      <h3 className={`flex items-center gap-2 font-black text-xs uppercase tracking-widest border-b pb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-900'}`} style={{ borderColor: isDarkMode ? 'rgb(30 41 59)' : '#94a3b8' }}><User size={14} className="text-blue-500" /> Personal Identity</h3>
      <div className="grid grid-cols-2 gap-y-6">
       {/* SEPARATED NAMES AS REQUESTED */}
       <InfoBlock label="First Name" value={student.first_name} isDarkMode={isDarkMode} />
       <InfoBlock label="Middle Name" value={student.middle_name || "N/A"} isDarkMode={isDarkMode} />
       <InfoBlock label="Last Name" value={student.last_name} isDarkMode={isDarkMode} />
       <InfoBlock label="Full Name" value={`${student.first_name} ${student.middle_name || ''} ${student.last_name}`} isDarkMode={isDarkMode} />
       
       <InfoBlock label="Gender" value={student.gender} isDarkMode={isDarkMode} />
       <InfoBlock label="Age" value={student.age?.toString()} isDarkMode={isDarkMode} />
       <InfoBlock label="Birth Date" value={student.birth_date} isDarkMode={isDarkMode} />
       <InfoBlock label="Civil Status" value={student.civil_status} isDarkMode={isDarkMode} />
       <InfoBlock label="Religion" value={student.religion} isDarkMode={isDarkMode} />
       <div className="col-span-2"><InfoBlock label="Home Address" value={student.address} icon={<MapPin size={10} />} isDarkMode={isDarkMode} /></div>
      </div>
     </div>
     <div className={`space-y-6 p-4 md:p-6 rounded-2xl transition-colors border border-transparent cursor-pointer ${isDarkMode ? 'hover:!bg-slate-800 hover:!border-slate-700' : 'hover:!bg-indigo-50 hover:!border-indigo-200'}`}>
      <h3 className={`flex items-center gap-2 font-black text-xs uppercase tracking-widest border-b pb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-900'}`} style={{ borderColor: isDarkMode ? 'rgb(30 41 59)' : '#94a3b8' }}><Mail size={14} className="text-indigo-500" /> Communication</h3>
      <div className="space-y-6"><InfoBlock label="Email Address" value={student.email} icon={<Mail size={10} />} isDarkMode={isDarkMode} /><InfoBlock label="Student Phone" value={student.phone || student.contact_no} icon={<Phone size={10} />} isDarkMode={isDarkMode} /><div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Database ID</p><p className={`text-[10px] font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{student.id}</p></div></div>
     </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 text-sm">
     <div className={`space-y-6 p-4 md:p-6 rounded-2xl transition-colors border border-transparent cursor-pointer ${isDarkMode ? 'hover:!bg-slate-800 hover:!border-slate-700' : 'hover:!bg-emerald-50 hover:!border-emerald-200'}`}>
      <h3 className={`flex items-center gap-2 font-black text-xs uppercase tracking-widest border-b pb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-900'}`} style={{ borderColor: isDarkMode ? 'rgb(30 41 59)' : '#94a3b8' }}><ShieldCheck size={14} className="text-emerald-500" /> Guardian Matrix</h3>
      <div className="space-y-4"><InfoBlock label="Full Guardian Name" value={`${student.guardian_first_name || student.guardian_name || ''} ${student.guardian_last_name || ''}`} isDarkMode={isDarkMode} /><InfoBlock label="Guardian Contact" value={student.guardian_phone || student.guardian_contact} icon={<Phone size={10} />} isDarkMode={isDarkMode} /></div>
     </div>
     <div className={`space-y-6 p-4 md:p-6 rounded-2xl transition-colors border border-transparent cursor-pointer ${isDarkMode ? 'hover:!bg-slate-800 hover:!border-slate-700' : 'hover:!bg-orange-50 hover:!border-orange-200'}`}>
      <h3 className={`flex items-center gap-2 font-black text-xs uppercase tracking-widest border-b pb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-900'}`} style={{ borderColor: isDarkMode ? 'rgb(30 41 59)' : '#94a3b8' }}><GraduationCap size={14} className="text-orange-500" /> Academic Standing</h3>
      <div className="grid grid-cols-2 gap-4"><div className={`col-span-2 p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}><p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Origin School</p><p className={`font-black uppercase text-xs ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{student.last_school_attended || "Not Provided"}</p></div><div className={`p-4 rounded-2xl border text-center ${isDarkMode ? 'bg-blue-900/20 border-blue-900/30' : 'bg-blue-50 border-blue-100'}`}><p className="text-[9px] font-bold text-blue-400 uppercase mb-1">GWA Matrix</p><p className={`text-2xl font-black ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{student.gwa_grade_10 || "0.0"}</p></div><div className={`p-4 rounded-2xl border text-center ${isDarkMode ? 'bg-orange-900/20 border-orange-900/30' : 'bg-orange-50 border-orange-100'}`}><p className="text-[9px] font-bold text-orange-400 uppercase mb-1">Target Strand</p><p className={`text-2xl font-black ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>{student.strand}</p></div></div>
     </div>
    </div>

    <div className={`space-y-6 pb-8 p-4 md:p-6 rounded-2xl transition-colors border border-transparent cursor-pointer ${isDarkMode ? 'hover:!bg-slate-800 hover:!border-slate-700' : 'hover:!bg-blue-50 hover:!border-blue-200'}`}>
     <h3 className={`flex items-center gap-2 font-black text-xs uppercase tracking-widest border-b pb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-900'}`} style={{ borderColor: isDarkMode ? 'rgb(30 41 59)' : '#94a3b8' }}><ScrollText size={14} className="text-blue-500" /> Registrar Credential Check</h3>
     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {isJHS && (<><CredentialCard label="Form 138" url={student.form_138_url} onOpen={onOpenFile} isDarkMode={isDarkMode} /><CredentialCard label="Good Moral" url={student.good_moral_url} onOpen={onOpenFile} isDarkMode={isDarkMode} /></>)}
      {isALS && (<><CredentialCard label="ALS COR Rating" url={student.cor_url} onOpen={onOpenFile} isDarkMode={isDarkMode} /><CredentialCard label="Diploma" url={student.diploma_url} onOpen={onOpenFile} isDarkMode={isDarkMode} /><CredentialCard label="AF5 Form" url={student.af5_url} onOpen={onOpenFile} isDarkMode={isDarkMode} /></>)}
      {!isJHS && !isALS && (<div className="col-span-full p-6 bg-amber-50 border border-amber-100 rounded-3xl text-center"><p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Unknown Category: Manual Verification Required</p></div>)}
     </div>
    </div>
   </div>
  </div>
 )
})
StudentDossier.displayName = "StudentDossier"
