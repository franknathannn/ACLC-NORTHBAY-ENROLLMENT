// src/app/admin/applicants/components/InfoBlock.tsx

import { memo } from "react"
import { ThemedText } from "@/components/ThemedText"

export const InfoBlock = memo(({ label, value, icon, isDarkMode }: { label: string, value: string, icon?: React.ReactNode, isDarkMode: boolean }) => {
 return (<div><ThemedText variant="label" className="mb-1" isDarkMode={isDarkMode}>{label}</ThemedText><ThemedText variant="body" className="font-bold flex items-center gap-2" isDarkMode={isDarkMode} style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>{icon}{value || "NOT PROVIDED"}</ThemedText></div>)
})
InfoBlock.displayName = "InfoBlock"
