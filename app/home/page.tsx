"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProfessionalNavigation } from "@/components/professional-navigation"
import AIPrompt from "@/components/ai-prompt"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { Brain, Sparkles, TrendingUp, BarChart3, Upload, Zap, Shield, Clock } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [aiResponse, setAiResponse] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  const handleAISubmit = async (message: string, model: string) => {
    setIsProcessing(true)
    toast.info(`Processing with ${model}...`)

    try {
      const response = await fetch("/api/process-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: message }),
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to process message")
      }

      const data = await response.json()
      setAiResponse(data.response)
      toast.success("Response generated successfully!")
    } catch (error) {
      toast.error("Failed to process message")
      console.error("AI processing error:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-8 w-8 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen">
      <ProfessionalNavigation />

      <main className="container max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <Brain className="h-16 w-16 text-slate-800" />
              <div className="absolute -top-2 -right-2">
                <Sparkles className="h-6 w-6 text-slate-600 animate-pulse" />
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-slate-800 mb-4">Welcome to TransactIQ</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
            Hello <span className="font-semibold text-slate-800">{user.name}</span>! Transform your spend data with
            AI-powered analysis, trade call parsing, and intelligent insights.
          </p>
        </div>

        {/* AI Chat Interface */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">AI Assistant</h2>
            <p className="text-slate-600">Ask me anything about your data, trade analysis, or get insights</p>
          </div>

          <AIPrompt onSubmit={handleAISubmit} />

          {/* AI Response */}
          {(aiResponse || isProcessing) && (
            <div className="mt-8">
              <Card className="glass shadow-xl border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-800">
                    <Brain className="mr-2 h-5 w-5" />
                    AI Response
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isProcessing ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
                      <span className="ml-3 text-slate-600">Generating response...</span>
                    </div>
                  ) : (
                    <div className="prose prose-slate max-w-none">
                      <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">{aiResponse}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-slate-800 mb-8 text-center">Quick Actions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/dashboard">
              <Card className="glass shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-slate-800 transition-colors">
                    <TrendingUp className="h-6 w-6 text-slate-700 group-hover:text-white" />
                  </div>
                  <CardTitle className="text-lg text-slate-800">Trade Parser</CardTitle>
                  <CardDescription>Parse natural language trade calls with AI</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/process">
              <Card className="glass shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-slate-800 transition-colors">
                    <Brain className="h-6 w-6 text-slate-700 group-hover:text-white" />
                  </div>
                  <CardTitle className="text-lg text-slate-800">AI Processor</CardTitle>
                  <CardDescription>Process text and files with AI analysis</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/upload">
              <Card className="glass shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-slate-800 transition-colors">
                    <Upload className="h-6 w-6 text-slate-700 group-hover:text-white" />
                  </div>
                  <CardTitle className="text-lg text-slate-800">Spend Analysis</CardTitle>
                  <CardDescription>Upload and enrich spend transaction data</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/analytics">
              <Card className="glass shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-slate-800 transition-colors">
                    <BarChart3 className="h-6 w-6 text-slate-700 group-hover:text-white" />
                  </div>
                  <CardTitle className="text-lg text-slate-800">Analytics</CardTitle>
                  <CardDescription>View comprehensive data insights</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="glass shadow-lg border border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-800">
                <Zap className="mr-2 h-5 w-5 text-yellow-600" />
                AI-Powered Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm">
                Leverage advanced AI models to analyze your data, parse trade calls, and generate insights with 98.5%
                accuracy.
              </p>
            </CardContent>
          </Card>

          <Card className="glass shadow-lg border border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-800">
                <Shield className="mr-2 h-5 w-5 text-green-600" />
                Validated Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm">
                All outputs are validated with 15+ business rules to ensure accuracy and compliance with trading
                standards.
              </p>
            </CardContent>
          </Card>

          <Card className="glass shadow-lg border border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-800">
                <Clock className="mr-2 h-5 w-5 text-blue-600" />
                Real-time Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm">
                Get instant results with processing times under 2 seconds, enabling real-time decision making.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
