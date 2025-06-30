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
    <nav className="bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            {onToggleSidebar && (
              <Button variant="ghost" size="sm" onClick={onToggleSidebar} className="lg:hidden hover:bg-accent">
                <Menu className="h-5 w-5" />
              </Button>
            )}

            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="relative">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <span className="text-xl font-semibold text-foreground">TransactIQ</span>
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {/* Theme toggle */}
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="relative hover:bg-accent">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {user && (
              <>
                {/* User info */}
                <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-md bg-muted/50">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{user.name}</span>
                </div>

                {/* Logout button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
