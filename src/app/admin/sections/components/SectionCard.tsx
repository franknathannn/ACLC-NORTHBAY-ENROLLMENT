// c:\Users\Nath\Documents\Enrollment System\enrollment-system\src\app\admin\sections\components\SectionCard.tsx

import { memo } from "react"
import { ThemedCard } from "@/components/ThemedCard"
import { ThemedText } from "@/components/ThemedText"
import { Badge } from "@/components/ui/badge"
import { Layers } from "lucide-react"
import { themeColors } from "@/lib/themeColors"

export const SectionCard = memo(function SectionCard({ section, isSelected, isDarkMode, config }: any) {
  const activeStudents = section.students?.filter((s: any) => s.status === 'Accepted' || s.status === 'Approved') || []
  const mCount = activeStudents.filter((s: any) => s.gender === 'Male').length
  const fCount = activeStudents.filter((s: any) => s.gender === 'Female').length
  const capacity = section.capacity || 40
  const mP = Math.min((mCount / capacity) * 100, 100)
  const fP = Math.min((fCount / capacity) * 100, 100)
  const isFull = (mCount + fCount) >= capacity

  return (
    <ThemedCard 
      className={`p-4 rounded-2xl hover:shadow-2xl hover:-translate-y-1 transition-[transform,background-color,border-color,box-shadow] duration-300 relative overflow-hidden group h-full bg-white dark:bg-slate-900 w-full max-w-full ${
        isSelected ? 'ring-2 md:ring-4 ring-blue-500 ring-offset-2 md:ring-offset-4 dark:ring-offset-slate-950' : ''
      }`}
      style={{
        backgroundColor: isDarkMode ? themeColors.dark.surface : themeColors.light.surface,
        borderColor: isDarkMode ? themeColors.dark.border : 'rgb(203 213 225)',
        borderWidth: '1px'
      }}
    >
      <div className={`absolute top-0 left-0 w-2.5 h-full ${section.strand === 'ICT' ? 'bg-blue-500' : 'bg-orange-500'}`} />
      <div className="flex justify-between items-start mb-5">
        <div>
        <ThemedText variant="h2" className="text-lg md:text-xl leading-none break-words" isDarkMode={isDarkMode}>
            {section.section_name}
          </ThemedText>
          <Badge variant="outline" className="mt-4 rounded-full font-black text-[10px] border-slate-100 dark:border-slate-800 text-slate-400 px-4 py-1 uppercase tracking-widest">
            S.Y. {config?.school_year || "UNSET"}
          </Badge>
        </div>
      </div>
      <div className="space-y-4 mb-6">
         <div className="flex justify-between items-end">
           <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
             <Layers size={16} /> Matrix Distribution
           </div>
           <span className="text-base font-black" style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
             {activeStudents.length} <span className="text-slate-300 dark:text-slate-600">/ {capacity}</span>
           </span>
         </div>
         <div 
           className="relative h-4 w-full rounded-full overflow-hidden shadow-inner border-none dark:border-slate-700" 
           style={{ backgroundColor: isDarkMode ? 'rgb(30 41 59)' : 'rgb(248 250 252)' }}
         >
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 z-10" style={{ backgroundColor: isDarkMode ? '#ffffff' : '#94a3b8' }} />
            <div 
              style={{ width: `${mP}%` }} 
              className={`absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-1000 ease-out ${
                isFull ? '' : 'rounded-r-full'
              }`} 
            />
            <div 
              style={{ width: `${fP}%` }} 
              className={`absolute right-0 top-0 bottom-0 bg-gradient-to-l from-pink-600 to-pink-400 transition-all duration-1000 ease-out ${
                isFull ? '' : 'rounded-l-full'
              }`} 
            />
         </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
         <div 
           className="p-4 rounded-2xl text-center border-none dark:border-slate-700 transition-all group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/20 group-hover:border-blue-200 dark:group-hover:border-blue-800" 
           style={{ backgroundColor: isDarkMode ? 'rgb(30 41 59)' : 'rgb(248 250 252)' }}
         >
           <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1.5">Males</p>
           <ThemedText variant="h3" className="text-lg" isDarkMode={isDarkMode}>{mCount}</ThemedText>
         </div>
         <div 
           className="p-4 rounded-2xl text-center border-none dark:border-slate-700 transition-all group-hover:bg-pink-50/50 dark:group-hover:bg-pink-900/20 group-hover:border-pink-200 dark:group-hover:border-pink-800" 
           style={{ backgroundColor: isDarkMode ? 'rgb(30 41 59)' : 'rgb(248 250 252)' }}
         >
           <p className="text-[8px] font-black text-pink-500 uppercase tracking-widest mb-1.5">Females</p>
           <ThemedText variant="h3" className="text-lg" isDarkMode={isDarkMode}>{fCount}</ThemedText>
         </div>
      </div>
    </ThemedCard>
  )
})
