// c:\Users\Nath\Documents\Enrollment System\enrollment-system\src\app\admin\sections\components\DeleteManagementDialog.tsx

import { memo } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings2, Trash2, AlertTriangle } from "lucide-react"
import { themeColors } from "@/lib/themeColors"

export const DeleteManagementDialog = memo(function DeleteManagementDialog({ sections, onDelete, onClearStudents, isDarkMode }: any) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest border-red-100 text-red-500 hover:bg-red-500 hover:text-white shadow-sm transition-all"
        >
          <Settings2 size={16} className="mr-2" /> Section Control
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="rounded-[32px] md:rounded-[48px] w-[95vw] max-w-xl p-0 overflow-hidden border-none shadow-2xl transition-colors duration-500"
        style={{ backgroundColor: isDarkMode ? themeColors.dark.surface : themeColors.light.surface }}
      >
        <Tabs defaultValue="sections">
          <DialogHeader className="p-8 bg-blue-600 dark:bg-slate-900 text-white relative">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <DialogTitle className="font-black uppercase tracking-tighter text-2xl">Control Center</DialogTitle>
                <DialogDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">
                  Manage Sections and Deletion
                </DialogDescription>
              </div>
              <TabsList className="bg-white/10 p-1 rounded-2xl border border-white/5">
                <TabsTrigger 
                  value="sections" 
                  className="rounded-xl px-4 py-2 font-black uppercase text-[9px] data-[state=active]:bg-white data-[state=active]:text-slate-900"
                >
                  Sections
                </TabsTrigger>
                <TabsTrigger 
                  value="danger" 
                  className="rounded-xl px-4 py-2 font-black uppercase text-[9px] data-[state=active]:bg-red-600 data-[state=active]:text-white"
                >
                  Registry
                </TabsTrigger>
              </TabsList>
            </div>
          </DialogHeader>
          
          <TabsContent value="sections" className="p-8 mt-0">
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {sections.map((sec: any) => (
                <div 
                  key={sec.id} 
                  className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-white hover:border-slate-200 transition-all"
                >
                  <div>
                    <p className="font-black text-slate-900 uppercase tracking-tight">{sec.section_name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {sec.strand} Section
                    </p>
                  </div>
                  <Button 
                    onClick={() => onDelete(sec.id, sec.section_name, sec.strand)} 
                    size="sm" 
                    className="bg-white hover:bg-red-600 text-red-500 hover:text-white rounded-2xl h-10 w-10 p-0 shadow-sm border border-red-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="danger" className="p-8 mt-0">
            <div className={`p-8 rounded-[32px] border space-y-6 text-center ${isDarkMode ? 'bg-red-900/20 border-red-900/30' : 'bg-red-50 border-red-100'}`}>
              <div className="w-16 h-16 bg-red-600 rounded-3xl flex items-center justify-center mx-auto text-white shadow-xl rotate-3">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="font-black text-red-600 uppercase tracking-tighter text-xl leading-none">
                  Delete Student Registry
                </h3>
                <p className={`text-xs font-medium italic leading-relaxed ${isDarkMode ? 'text-red-300' : 'text-red-400'}`}>
                  This action is non-reversible. Every student record, including verified and pending applications, 
                  will be permanently erased from the database.
                </p>
              </div>
              <Button 
                onClick={onClearStudents} 
                className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-500/20 transition-all"
              >
                Execute Registry Wipe
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
})
