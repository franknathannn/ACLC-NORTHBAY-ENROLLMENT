// src/app/admin/applicants/components/CredentialCard.tsx

import { memo } from "react"
import { FileText, ZoomIn } from "lucide-react"

export const CredentialCard = memo(({ label, url, onOpen, isDarkMode }: { label: string, url: string, onOpen: (url: string, label: string) => void, isDarkMode?: boolean }) => {
 if (!url) return (<div className={`p-4 rounded-2xl border border-dashed flex flex-col items-center justify-center opacity-50 h-32 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-300'}`}><FileText className="text-slate-400 mb-2" size={24} /><p className="text-[8px] font-black text-center uppercase text-slate-500 tracking-widest">{label}</p></div>);
 return (
  <div onClick={() => onOpen(url, label)} className="cursor-pointer group">
   <div className={`p-2 rounded-2xl border hover:border-blue-400 hover:shadow-xl transition-all h-full relative ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
    <div className={`h-28 rounded-xl overflow-hidden relative ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
     {url.toLowerCase().endsWith('.pdf') ? (<div className={`w-full h-full flex flex-col items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}><FileText size={32} className="text-slate-400" /><p className="text-[8px] font-black uppercase text-slate-500 mt-2">PDF Document</p></div>) : (<img src={url} alt={label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" decoding="async" />)}
     <div className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><ZoomIn className="text-white" size={20} /></div>
    </div>
    <p className={`text-[9px] font-black text-center mt-3 uppercase tracking-widest leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{label}</p>
   </div>
  </div>
 )
})
CredentialCard.displayName = "CredentialCard"
