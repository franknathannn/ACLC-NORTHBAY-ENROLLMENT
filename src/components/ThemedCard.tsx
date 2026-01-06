import React from "react";
import { cn } from "@/lib/utils";

interface ThemedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "highlight" | "ghost";
}

export function ThemedCard({ children, className, variant = "default", ...props }: ThemedCardProps) {
  return (
    <div 
      className={cn(
        "rounded-[32px] border transition-all duration-500",
        // Light Mode Defaults
        "bg-white border-slate-200 shadow-sm",
        // Dark Mode Defaults
        "dark:bg-slate-900 dark:border-slate-800 dark:shadow-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}