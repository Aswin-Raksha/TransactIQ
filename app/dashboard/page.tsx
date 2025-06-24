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
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export default function DashboardPage() {
  const [tradeCall, setTradeCall] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [tradeCalls, setTradeCalls] = useState<any[]>([])
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchTradeCalls()
    }
  }, [user])

  const fetchTradeCalls = async () => {
    try {
      const response = await fetch("/api/tradecalls", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setTradeCalls(data.tradeCalls)
      }
    } catch (error) {
      console.error("Failed to fetch trade calls:", error)
    }
  }

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
        fetchTradeCalls() // Refresh the list
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">🤖 AI Trade Call Parser</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Welcome back, {user.name}! Enter natural language trade calls and get structured JSON output with
              validation.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Form */}
            <div className="space-y-6">
              {/* Main Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Trade Call Input</CardTitle>
                  <CardDescription>
                    Enter your natural language trade call below and click parse to get structured output
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="tradeCall">Trade Call</Label>
                      <Textarea
                        id="tradeCall"
                        value={tradeCall}
                        onChange={(e) => setTradeCall(e.target.value)}
                        placeholder="Example: Buy NIFTY 23000 CE monthly @160 target 200/20 SL 120/110"
                        className="min-h-[120px]"
                        disabled={loading}
                      />
                    </div>

                    <div className="flex gap-4">
                      <Button type="submit" disabled={loading || !tradeCall.trim()} className="flex-1">
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "🚀 Parse & Save"
                        )}
                      </Button>

                      <Button type="button" variant="outline" onClick={clearForm}>
                        Clear
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Recent Trade Calls */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Recent Trade Calls</CardTitle>
                  <CardDescription>Your last {tradeCalls.length} parsed trade calls</CardDescription>
                </CardHeader>
                <CardContent>
                  {tradeCalls.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {tradeCalls.slice(0, 5).map((call, index) => (
                        <div key={call._id} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline">{call.transType}</Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(call.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{call.tradingSymbol}</p>
                          <p className="text-xs text-gray-600 mt-1">{call.originalInput}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No trade calls yet. Parse your first one!</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Results */}
            <div className="space-y-6">
              {/* Success Result */}
              {result && (
                <>
                  {/* Success Alert */}
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Success!</AlertTitle>
                    <AlertDescription>{result.message}</AlertDescription>
                  </Alert>

                  {/* Parsed JSON Output */}
                  <Card>
                    <CardHeader>
                      <CardTitle>📊 Parsed & Validated JSON</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>

                  {/* Field Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle>🔍 Field Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Transaction Type</Label>
                            <p className="text-lg font-semibold text-gray-900">{result.data.transType}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Trading Symbol</Label>
                            <p className="text-lg font-semibold text-gray-900">{result.data.tradingSymbol}</p>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-500">Target Range</Label>
                          <p
                            className={`text-lg font-semibold ${
                              result.data.targetLowerBound === "Invalid Input" ? "text-red-600" : "text-gray-900"
                            }`}
                          >
                            {result.data.targetLowerBound} - {result.data.targetUpperBound}
                          </p>
                          {result.data.targetLowerBound === "Invalid Input" && (
                            <Badge variant="destructive" className="mt-1">
                              Invalid Input
                            </Badge>
                          )}
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-500">Stop Loss Range</Label>
                          <p
                            className={`text-lg font-semibold ${
                              result.data.stoplossLowerBound === "Invalid Input" ? "text-red-600" : "text-gray-900"
                            }`}
                          >
                            {result.data.stoplossLowerBound} - {result.data.stoplossUpperBound}
                          </p>
                          {result.data.stoplossLowerBound === "Invalid Input" && (
                            <Badge variant="destructive" className="mt-1">
                              Invalid Input
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Examples Section */}
              <Card>
                <CardHeader>
                  <CardTitle>💡 Example Trade Calls</CardTitle>
                  <CardDescription>Try these examples to see how the AI parser works</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Valid Examples
                      </h4>
                      <div className="space-y-2">
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="p-3">
                            <code className="text-sm">Buy NIFTY 23000 CE monthly @160 target 200/20 SL 120/110</code>
                          </CardContent>
                        </Card>
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="p-3">
                            <code className="text-sm">Sell TATAMOTORS at 1500 with target 240/120 and SL 1480/70</code>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                        Invalid Examples
                      </h4>
                      <div className="space-y-2">
                        <Card className="bg-red-50 border-red-200">
                          <CardContent className="p-3">
                            <code className="text-sm">Buy SBIN @600 target 610/590 SL 595/605</code>
                            <p className="text-xs text-red-600 mt-1">Invalid target range for Buy</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
