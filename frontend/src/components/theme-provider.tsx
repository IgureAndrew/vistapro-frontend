"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import React from "react"

export function ThemeProvider({ children }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  )
}
