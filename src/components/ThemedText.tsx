"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/hooks/useTheme"
import { themeColors } from "@/lib/themeColors"

interface ThemedTextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label'
  muted?: boolean
  as?: React.ElementType
  isDarkMode?: boolean
}

export function ThemedText({ 
  variant = 'body', 
  muted = false,
  className, 
  style, 
  children, 
  as,
  isDarkMode: propIsDarkMode,
  ...props 
}: ThemedTextProps) {
  const { isDarkMode: hookIsDarkMode } = useTheme()
  
  // Use the prop if it exists, otherwise use the hook
  const isDarkMode = propIsDarkMode ?? hookIsDarkMode

  const Component = as || (
    variant === 'h1' ? 'h1' :
    variant === 'h2' ? 'h2' :
    variant === 'h3' ? 'h3' :
    'p'
  )

  const baseStyles = {
    h1: "text-4xl md:text-6xl font-black tracking-tighter uppercase",
    h2: "text-3xl md:text-5xl font-black tracking-tighter",
    h3: "text-xl md:text-2xl font-black uppercase tracking-wide",
    body: "text-base font-medium",
    caption: "text-xs font-bold uppercase tracking-wider",
    label: "text-[10px] font-black uppercase tracking-[0.2em]"
  }

  const defaultColor = isDarkMode 
    ? (muted || variant === 'caption' || variant === 'label' ? themeColors.dark.text.muted : themeColors.dark.text.primary)
    : (muted || variant === 'caption' || variant === 'label' ? themeColors.light.text.secondary : themeColors.light.text.primary)

  return (
    <Component 
      className={cn(baseStyles[variant], className)}
      style={{
        color: style?.color || defaultColor,
        ...style
      }}
      {...props}
    >
      {children}
    </Component>
  )
}