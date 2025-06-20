"use client"

import type React from "react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export default function HomePage() {
  const [tradeCall, setTradeCall] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">🤖 AI Trade Call Parser</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Enter natural language trade calls and get structured JSON output with validation. Powered by OpenAI
              GPT-4o-mini with strict trading logic.
            </p>
          </div>

          {/* Main Form */}
          <Card className="mb-8">
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

          {/* Success Result */}
          {result && (
            <div className="space-y-6">
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
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Transaction Type</Label>
                        <p className="text-lg font-semibold text-gray-900">{result.data.transType}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Trading Symbol</Label>
                        <p className="text-lg font-semibold text-gray-900">{result.data.tradingSymbol}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Expiry Date</Label>
                        <p className="text-lg font-semibold text-gray-900">
                          {result.data.expiryDate || "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Price Range</Label>
                        <p className="text-lg font-semibold text-gray-900">
                          {result.data.priceLowerBound} - {result.data.priceUpperBound}
                        </p>
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
                  </div>
                </CardContent>
              </Card>

              {/* Raw GPT Response */}
              <Card>
                <CardHeader>
                  <CardTitle>🤖 Raw GPT Response</CardTitle>
                  <CardDescription>The original response from OpenAI GPT-4o-mini</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm text-gray-800">
                    {result.rawGptResponse}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Examples Section */}
          <Card className="mt-12">
            <CardHeader>
              <CardTitle>💡 Example Trade Calls</CardTitle>
              <CardDescription>Try these examples to see how the AI parser works</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Valid Examples
                  </h4>
                  <div className="space-y-3">
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
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-3">
                        <code className="text-sm">Buy INFY monthly @1350 target 1375/90 SL 1330/20</code>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                    Invalid Examples
                  </h4>
                  <div className="space-y-3">
                    <Card className="bg-red-50 border-red-200">
                      <CardContent className="p-3">
                        <code className="text-sm">Buy SBIN @600 target 610/590 SL 595/605</code>
                        <p className="text-xs text-red-600 mt-1">Invalid target range for Buy</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-red-50 border-red-200">
                      <CardContent className="p-3">
                        <code className="text-sm">Sell NIFTY @850 target 900/910 SL 120/20</code>
                        <p className="text-xs text-red-600 mt-1">Invalid SL range for Sell</p>
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
  )
}
