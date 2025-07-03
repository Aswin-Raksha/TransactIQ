"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useTheme } from "@/lib/theme-context"
import { Brain, LogOut, User, Sun, Moon, Menu } from "lucide-react"

interface ProfessionalNavigationProps {
  onToggleSidebar?: () => void
}

export function ProfessionalNavigation({ onToggleSidebar }: ProfessionalNavigationProps) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 glass shadow-sm">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/home" className="mr-6 flex items-center space-x-2">
            <Brain className="h-6 w-6 text-slate-800" />
            <span className="hidden font-bold sm:inline-block text-slate-800">TransactIQ</span>
          </Link>
          <div className="hidden md:flex items-center space-x-6 ml-6">
            <Link href="/home" className="text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">
              Home
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Dashboard
            </Link>
            <Link href="/process" className="text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">
              Process
            </Link>
            <Link
              href="/analytics"
              className="text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Analytics
            </Link>
            <Link href="/upload" className="text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">
              Upload
            </Link>
          </div>
        </div>

        {onToggleSidebar && (
          <Button
            variant="ghost"
            className="mr-2 px-0 text-base hover:bg-slate-100 focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            onClick={onToggleSidebar}
          >
            <Menu className="h-5 w-5 text-slate-700" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        )}

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Link href="/home" className="mr-6 flex items-center space-x-2 md:hidden">
              <Brain className="h-6 w-6 text-slate-800" />
              <span className="font-bold text-slate-800">TransactIQ</span>
            </Link>
          </div>

          <nav className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="h-8 w-8 px-0 hover:bg-slate-100">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-slate-700" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-slate-300" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {user && (
              <>
                <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-md bg-slate-100 text-sm">
                  <User className="h-4 w-4 text-slate-600" />
                  <span className="font-medium text-slate-800">{user.name}</span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="h-8 text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </nav>
  )
}
