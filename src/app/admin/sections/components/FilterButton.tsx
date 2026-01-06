// c:\Users\Nath\Documents\Enrollment System\enrollment-system\src\app\admin\sections\components\FilterButton.tsx

import { memo } from "react"

export const FilterButton = memo(function FilterButton({ label, active, onClick, icon, type, isDarkMode }: any) {
  const isICT = type === 'ICT';
  const isGAS = type === 'GAS';

  // UI EXPERT COLOR MAPPING: Maintaining original dimensions (px-6 py-2.5)
  const activeClass = isICT 
    ? 'bg-blue-600 !text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' 
    : isGAS 
    ? 'bg-orange-600 !text-white shadow-[0_0_20px_rgba(234,88,12,0.4)]' 
    : 'bg-slate-900 !text-white';

  const hoverClass = isICT 
    ? 'hover:bg-blue-500/10 hover:!text-blue-500' 
    : isGAS 
    ? 'hover:bg-orange-500/10 hover:!text-orange-500' 
    : 'hover:bg-slate-500/10 hover:!text-slate-400';

  return (
    <button 
      onClick={onClick} 
      className={`flex items-center gap-2 px-6 py-2.5 rounded-[18px] font-black uppercase text-[10px] tracking-widest transition-all duration-300 relative overflow-hidden isolate ${
        active 
          ? `${activeClass} scale-105 z-10` 
          : `text-slate-500 dark:text-slate-400 bg-transparent ${hoverClass}`
      }`}
    >
      {/* Internal Specular Highlight for Active State */}
      {active && (
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-40 pointer-events-none" />
      )}
      
      <span className={`shrink-0 transition-transform duration-500 ${active ? 'scale-110' : 'opacity-40'}`}>
        {icon}
      </span>
      
      <span className="relative z-10">{label}</span>
    </button>
  )
})