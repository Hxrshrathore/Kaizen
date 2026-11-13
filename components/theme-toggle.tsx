"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { AnimatedThemeToggler, TransitionVariant } from "@/components/ui/animated-theme-toggler"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
  variant?: TransitionVariant
}

export function ThemeToggle({ className, variant = "circle" }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div 
        className={cn(
          "w-9 h-9 rounded-xl border border-border bg-card/60 flex items-center justify-center text-muted-foreground",
          className
        )} 
        aria-hidden="true"
      />
    )
  }

  const currentTheme = (theme === "system" ? resolvedTheme : theme) || "dark"

  return (
    <AnimatedThemeToggler
      variant={variant}
      theme={currentTheme === "dark" ? "dark" : "light"}
      onThemeChange={(newTheme) => setTheme(newTheme)}
      className={cn(
        "w-9 h-9 rounded-xl border border-border/70 bg-card/70 hover:bg-card/90 hover:border-primary/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 shadow-sm cursor-pointer select-none",
        className
      )}
      title={`Switch to ${currentTheme === "dark" ? "light" : "dark"} mode`}
    />
  )
}
