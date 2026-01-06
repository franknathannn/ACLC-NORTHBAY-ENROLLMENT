// src/app/admin/applicants/components/DocumentViewerModal.tsx
import { memo } from "react"
import { RotateCw, Download, X, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface DocumentViewerModalProps {
  viewerOpen: boolean
  setViewerOpen: (open: boolean) => void
  viewingFile: { url: string, label: string } | null
  rotation: number
  setRotation: React.Dispatch<React.SetStateAction<number>>
}

export const DocumentViewerModal = memo(({ 
  viewerOpen, setViewerOpen, viewingFile, rotation, setRotation 
}: DocumentViewerModalProps) => {
  return (
    <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] md:h-[95vh] p-0 rounded-[32px] md:rounded-[40px] overflow-hidden border-none shadow-2xl bg-slate-950/95 flex flex-col [&>button]:hidden">
        {/* HEADER BAR (Prevents title overlap) */}
        <div className="p-6 bg-slate-900 border-b border-white/5 flex items-center justify-between shrink-0">
          <div>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1">Registrar Inspection Matrix</p>
            <DialogTitle className="text-white font-black uppercase text-xl leading-none">
              {viewingFile?.label}
            </DialogTitle>
            <DialogDescription className="hidden">High-resolution document view</DialogDescription>
          </div>
          <div className="flex gap-3">
            {/* ROTATE & DOWNLOAD TOOLS */}
            <Button variant="ghost" size="icon" onClick={() => setRotation(r => (r + 90) % 360)} className="rounded-full bg-white/10 hover:bg-white/20 text-white"><RotateCw size={20}/></Button>
            <Button variant="ghost" size="icon" onClick={() => window.open(viewingFile?.url, '_blank')} className="rounded-full bg-white/10 hover:bg-white/20 text-white"><Download size={20}/></Button>
            <Button variant="ghost" size="icon" onClick={() => setViewerOpen(false)} className="rounded-full bg-red-500 hover:bg-red-600 text-white"><X size={20}/></Button>
          </div>
        </div>

        {/* INSPECTION AREA */}
        <div className="flex-1 w-full flex items-center justify-center p-12 overflow-auto custom-scrollbar">
          {viewingFile?.url.toLowerCase().endsWith('.pdf') ? (
            <iframe src={viewingFile.url} className="w-full h-full rounded-2xl bg-white border-none" title="PDF Viewer" />
          ) : (
            <div className="relative group cursor-zoom-in transition-transform duration-300" style={{ transform: `rotate(${rotation}deg)` }}>
              <img src={viewingFile?.url} alt="Inspection" className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-500" />
            </div>
          )}
        </div>
        
        <div className="p-6 bg-slate-900/50 backdrop-blur-xl border-t border-white/5 flex items-center justify-center shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-slate-400 uppercase font-black text-[9px] tracking-widest"><Maximize2 size={12}/> Document Render: Active</div>
            <div className="w-[1px] h-4 bg-white/10" />
            <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest italic text-center">Rotate or Download for secondary inspection tools</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})
DocumentViewerModal.displayName = "DocumentViewerModal"
