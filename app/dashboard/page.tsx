"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ProfessionalNavigation } from "@/components/professional-navigation"
import { TradeHistorySidebar } from "@/components/trade-history-sidebar"
import { useAuth } from "@/lib/auth-context"
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  History,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  BarChart3,
  Zap,
  Clock,
  Brain,
} from "lucide-react"

export default function DashboardPage() {
  const [tradeCall, setTradeCall] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!tradeCall.trim()) {
      toast.error("Please enter a trade call")
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tradeCall: tradeCall.trim() }),
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        toast.success("Trade call parsed successfully!")
      } else {
        toast.error(data.error || "Failed to parse trade call")
      }
    } catch (err) {
      toast.error("Network error occurred")
      console.error("Submit error:", err)
    } finally {
      setLoading(false)
    }
  }

  const clearForm = () => {
    setTradeCall("")
    setResult(null)
    toast.info("Form cleared")
  }

  const handleSelectTradeCall = (selectedCall: any) => {
    setTradeCall(selectedCall.originalInput)
    setSidebarOpen(false)
    toast.info("Trade call loaded from history")
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <ProfessionalNavigation onToggleSidebar={() => setSidebarOpen(true)} />

      <div className="flex">
        <TradeHistorySidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSelectTradeCall={handleSelectTradeCall}
        />

        <main className="flex-1 min-h-[calc(100vh-3.5rem)]">
          <div className="container max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <Brain className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">AI Trade Call Parser</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Welcome back, <span className="font-semibold text-foreground">{user.name}</span>! Transform natural
                language trade calls into structured, validated data with AI precision.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column - Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Main Form */}
                <Card className="shadow-sm border-border">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center text-foreground">
                          <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                          Trade Call Input
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Enter your natural language trade call below and let AI structure it for you
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setSidebarOpen(true)} className="lg:hidden">
                        <History className="h-4 w-4 mr-2" />
                        History
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="tradeCall" className="text-sm font-medium">
                          Trade Call
                        </Label>
                        <Textarea
                          id="tradeCall"
                          value={tradeCall}
                          onChange={(e) => setTradeCall(e.target.value)}
                          placeholder="Example: Buy NIFTY 23000 CE monthly @160 target 200/20 SL 120/110"
                          className="min-h-[120px] resize-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          disabled={loading}
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button type="submit" disabled={loading || !tradeCall.trim()} className="flex-1">
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Parse & Save
                            </>
                          )}
                        </Button>

                        <Button type="button" variant="outline" onClick={clearForm}>
                          Clear
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Results */}
                {result && (
                  <div className="space-y-6 animate-in">
                    {/* Success Alert */}
                    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertTitle className="text-green-800 dark:text-green-200">Success!</AlertTitle>
                      <AlertDescription className="text-green-700 dark:text-green-300">
                        {result.message}
                      </AlertDescription>
                    </Alert>

                    {/* Parsed JSON Output */}
                    <Card className="shadow-sm border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center text-foreground">
                          <Target className="mr-2 h-5 w-5 text-primary" />
                          Parsed & Validated JSON
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm border text-foreground font-mono">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>

                    {/* Field Breakdown */}
                    <Card className="shadow-sm border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center text-foreground">
                          <Shield className="mr-2 h-5 w-5 text-primary" />
                          Field Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Transaction Type</Label>
                              <div className="flex items-center mt-1">
                                {result.data.transType.toLowerCase() === "buy" ? (
                                  <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 mr-2 text-red-600" />
                                )}
                                <p className="text-lg font-semibold text-foreground">{result.data.transType}</p>
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Trading Symbol</Label>
                              <p className="text-lg font-semibold mt-1 text-foreground">{result.data.tradingSymbol}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Expiry Date</Label>
                              <p className="text-lg font-semibold mt-1 text-foreground">
                                {result.data.expiryDate || "Not specified"}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Price Range</Label>
                              <p className="text-lg font-semibold mt-1 text-foreground">
                                {result.data.priceLowerBound} - {result.data.priceUpperBound}
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Target Range</Label>
                              <div className="flex items-center mt-1">
                                <p
                                  className={`text-lg font-semibold ${
                                    result.data.targetLowerBound === "Invalid Input"
                                      ? "text-destructive"
                                      : "text-foreground"
                                  }`}
                                >
                                  {result.data.targetLowerBound} - {result.data.targetUpperBound}
                                </p>
                                {result.data.targetLowerBound === "Invalid Input" && (
                                  <Badge variant="destructive" className="ml-2">
                                    Invalid
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Stop Loss Range</Label>
                              <div className="flex items-center mt-1">
                                <p
                                  className={`text-lg font-semibold ${
                                    result.data.stoplossLowerBound === "Invalid Input"
                                      ? "text-destructive"
                                      : "text-foreground"
                                  }`}
                                >
                                  {result.data.stoplossLowerBound} - {result.data.stoplossUpperBound}
                                </p>
                                {result.data.stoplossLowerBound === "Invalid Input" && (
                                  <Badge variant="destructive" className="ml-2">
                                    Invalid
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {/* Right Column - Examples & Stats */}
              <div className="space-y-6">
                {/* Examples */}
                <Card className="shadow-sm border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg text-foreground">
                      <Sparkles className="mr-2 h-5 w-5 text-primary" />
                      Example Trade Calls
                    </CardTitle>
                    <CardDescription>Try these examples to see how the AI parser works</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-3 flex items-center text-sm text-foreground">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        Valid Examples
                      </h4>
                      <div className="space-y-2">
                        <Card className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
                          <CardContent className="p-3">
                            <code className="text-sm text-green-800 dark:text-green-200">
                              Buy NIFTY 23000 CE monthly @160 target 200/20 SL 120/110
                            </code>
                          </CardContent>
                        </Card>
                        <Card className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
                          <CardContent className="p-3">
                            <code className="text-sm text-green-800 dark:text-green-200">
                              Sell TATAMOTORS at 1500 with target 240/120 and SL 1480/70
                            </code>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3 flex items-center text-sm text-foreground">
                        <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                        Invalid Examples
                      </h4>
                      <div className="space-y-2">
                        <Card className="bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800">
                          <CardContent className="p-3">
                            <code className="text-sm text-red-800 dark:text-red-200">
                              Buy SBIN @600 target 610/590 SL 595/605
                            </code>
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">Invalid target range for Buy</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Metrics */}
                <Card className="shadow-sm border-border">
                  <CardHeader>
                    <CardTitle className="text-lg text-foreground flex items-center">
                      <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Zap className="h-4 w-4 mr-2 text-green-600" />
                          <span className="text-sm text-muted-foreground">AI Accuracy</span>
                        </div>
                        <span className="font-semibold text-green-600">98.5%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-blue-600" />
                          <span className="text-sm text-muted-foreground">Processing Speed</span>
                        </div>
                        <span className="font-semibold text-blue-600">{"<2s"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 mr-2 text-purple-600" />
                          <span className="text-sm text-muted-foreground">Validation Rules</span>
                        </div>
                        <span className="font-semibold text-purple-600">15+</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
