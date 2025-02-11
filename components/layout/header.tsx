"use client"

import { ThemeToggle } from "@/components/theme-toggle"

export function Header() {
  return (
    <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Unfold</h1>
        <ThemeToggle />
      </div>
    </header>
  );
}