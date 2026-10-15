"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"

export type ThemeMode = "light" | "dark" | "system"

interface ThemeContextType {
  theme: ThemeMode
  resolvedTheme: "light" | "dark"
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = "aksara_theme"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light")
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")
  const [mounted, setMounted] = useState(false)

  // Determine system preference
  const getSystemTheme = (): "light" | "dark" => {
    if (typeof window === "undefined") return "light"
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  }

  // Apply theme class to document
  const applyTheme = useCallback((mode: ThemeMode) => {
    if (typeof document === "undefined") return

    const root = document.documentElement
    const target = mode === "system" ? getSystemTheme() : mode

    if (target === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    setResolvedTheme(target)
  }, [])

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null
      const initialMode: ThemeMode = saved === "dark" || saved === "light" || saved === "system" ? saved : "light"
      setThemeState(initialMode)
      applyTheme(initialMode)
    } catch {
      applyTheme("light")
    }
    setMounted(true)
  }, [applyTheme])

  // Listen to system preference changes when mode is "system"
  useEffect(() => {
    if (typeof window === "undefined") return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system")
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme, applyTheme])

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    } catch {}
    applyTheme(newTheme)
  }

  const toggleTheme = () => {
    const nextTheme: ThemeMode = resolvedTheme === "dark" ? "light" : "dark"
    setTheme(nextTheme)
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
