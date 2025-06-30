import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/lib/theme-context"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TransactIQ - AI Trade Call Parser",
  description: "Parse natural language trade calls using AI with strict validation rules",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
          <Toaster position="top-right" richColors closeButton duration={4000} />
        </ThemeProvider>
      </body>
    </html>
  )
}
