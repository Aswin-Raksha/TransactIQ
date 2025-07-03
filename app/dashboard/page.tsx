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
import { TradeHistorySidebar } from "@/components/trade-history-sidebar"
import SimpleAIPrompt from "@/components/simple-ai-prompt"
import SimpleNavigation from "@/components/simple-navigation"
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
  FileText,
  Download,
  Copy,
  MessageSquare,
} from "lucide-react"
import Link from "next/link"

interface AIResponse {
  response: string
  timestamp: string
  model: string
  filename?: string
}

export default function DashboardPage() {
  const [tradeCall, setTradeCall] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ type: "user" | "ai"; content: string; timestamp: string; model?: string; filename?: string }>
  >([])

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

  const handleAISubmit = async (message: string, model: string, file?: File) => {
    setIsProcessing(true)

    // Add user message to history
    const userMessage = {
      type: "user" as const,
      content: file ? `${message} [File: ${file.name}]` : message,
      timestamp: new Date().toISOString(),
      filename: file?.name,
    }
    setConversationHistory((prev) => [...prev, userMessage])

    try {
      let response

      if (file) {
        // Handle file upload
        const formData = new FormData()
        formData.append("file", file)

        response = await fetch("/api/process-file", {
          method: "POST",
          body: formData,
          credentials: "include",
        })
      } else {
        // Handle text input
        response = await fetch("/api/process-text", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: message }),
          credentials: "include",
        })
      }

      if (!response.ok) {
        throw new Error("Failed to process request")
      }

      const data = await response.json()
      const aiResponseData: AIResponse = {
        response: file ? data.analysis : data.response,
        timestamp: data.timestamp || new Date().toISOString(),
        model,
        filename: file?.name,
      }

      setAiResponse(aiResponseData)

      // Add AI response to history
      const aiMessage = {
        type: "ai" as const,
        content: aiResponseData.response,
        timestamp: aiResponseData.timestamp,
        model: aiResponseData.model,
        filename: aiResponseData.filename,
      }
      setConversationHistory((prev) => [...prev, aiMessage])

      toast.success(file ? "File analyzed successfully!" : "Response generated successfully!")
    } catch (error) {
      toast.error("Failed to process request")
      console.error("AI processing error:", error)
    } finally {
      setIsProcessing(false)
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy")
    }
  }

  const downloadResponse = (response: string, filename?: string) => {
    const blob = new Blob([response], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename ? `analysis-${filename}.txt` : `ai-response-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Downloaded successfully")
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleNavigation />

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
                  <Brain className="h-12 w-12 text-gray-800" />
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">Welcome to TransactIQ</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Hello <span className="font-semibold text-gray-800">{user.name}</span>! Upload documents or ask
                questions to get AI-powered analysis and insights.
              </p>
            </div>

            {/* AI Chat Interface */}
            <div className="mb-8">
              <SimpleAIPrompt onSubmit={handleAISubmit} disabled={isProcessing} />
            </div>

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="mb-8">
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-3 text-blue-600" />
                    <span className="text-blue-800">Processing your request...</span>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Latest AI Response */}
            {aiResponse && !isProcessing && (
              <div className="mb-8">
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center text-green-800">
                        <Brain className="mr-2 h-5 w-5" />
                        AI Response
                        {aiResponse.filename && (
                          <span className="ml-2 text-sm font-normal text-green-600">
                            (Analysis of {aiResponse.filename})
                          </span>
                        )}
                      </CardTitle>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(aiResponse.response)}
                          className="text-green-700 border-green-300 hover:bg-green-100"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadResponse(aiResponse.response, aiResponse.filename)}
                          className="text-green-700 border-green-300 hover:bg-green-100"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <CardDescription className="text-green-600">
                      Generated with {aiResponse.model} • {new Date(aiResponse.timestamp).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-green max-w-none">
                      <div className="whitespace-pre-wrap text-green-800 leading-relaxed bg-white p-4 rounded-lg border border-green-200">
                        {aiResponse.response}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Conversation History */}
            {conversationHistory.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Conversation History</h2>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {conversationHistory.slice(-6).map((message, index) => (
                    <Card
                      key={index}
                      className={message.type === "user" ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-white"}
                    >
                      <CardContent className="py-3">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {message.type === "user" ? (
                              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                <Brain className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {message.type === "user" ? user.name : "AI Assistant"}
                              </span>
                              {message.model && <span className="text-xs text-gray-500">({message.model})</span>}
                              <span className="text-xs text-gray-500">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="text-sm text-gray-700 whitespace-pre-wrap">{message.content}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Features Grid - Updated with clean white styling */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="border-gray-200 bg-white hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-800">
                    <MessageSquare className="mr-2 h-5 w-5 text-blue-600" />
                    Text Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">
                    Ask questions, get insights, or analyze any text content with advanced AI models.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-gray-200 bg-white hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-800">
                    <FileText className="mr-2 h-5 w-5 text-green-600" />
                    Document Processing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">
                    Upload documents (PDF, Word, CSV, TXT) for comprehensive AI analysis and insights.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-gray-200 bg-white hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-800">
                    <Download className="mr-2 h-5 w-5 text-purple-600" />
                    Export Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">
                    Download your analysis results and maintain a history of all your AI interactions.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Legacy Trade Call Section - Updated with clean styling */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column - Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Main Form - Updated styling */}
                <Card className="shadow-lg border border-gray-200 bg-white">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center text-gray-800">
                          <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
                          Trade Call Input
                        </CardTitle>
                        <CardDescription className="mt-1 text-gray-600">
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
                        <Label htmlFor="tradeCall" className="text-sm font-medium text-gray-700">
                          Trade Call
                        </Label>
                        <Textarea
                          id="tradeCall"
                          value={tradeCall}
                          onChange={(e) => setTradeCall(e.target.value)}
                          placeholder="Example: Buy NIFTY 23000 CE monthly @160 target 200/20 SL 120/110"
                          className="min-h-[120px] resize-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-white border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                          disabled={loading}
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          type="submit"
                          disabled={loading || !tradeCall.trim()}
                          className="flex-1 bg-gray-800 hover:bg-gray-700 text-white"
                        >
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

                        <Button
                          type="button"
                          variant="outline"
                          onClick={clearForm}
                          className="border-gray-200 hover:bg-gray-50 bg-transparent"
                        >
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
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-800">Success!</AlertTitle>
                      <AlertDescription className="text-green-700">{result.message}</AlertDescription>
                    </Alert>

                    {/* Parsed JSON Output */}
                    <Card className="shadow-lg border border-gray-200 bg-white">
                      <CardHeader>
                        <CardTitle className="flex items-center text-gray-800">
                          <Target className="mr-2 h-5 w-5 text-blue-600" />
                          Parsed & Validated JSON
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm border text-gray-800 font-mono border-gray-200">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>

                    {/* Field Breakdown */}
                    <Card className="shadow-lg border border-gray-200 bg-white">
                      <CardHeader>
                        <CardTitle className="flex items-center text-gray-800">
                          <Shield className="mr-2 h-5 w-5 text-blue-600" />
                          Field Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-600">Transaction Type</Label>
                              <div className="flex items-center mt-1">
                                {result.data.transType.toLowerCase() === "buy" ? (
                                  <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 mr-2 text-red-600" />
                                )}
                                <p className="text-lg font-semibold text-gray-800">{result.data.transType}</p>
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-600">Trading Symbol</Label>
                              <p className="text-lg font-semibold mt-1 text-gray-800">{result.data.tradingSymbol}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-600">Expiry Date</Label>
                              <p className="text-lg font-semibold mt-1 text-gray-800">
                                {result.data.expiryDate || "Not specified"}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-600">Price Range</Label>
                              <p className="text-lg font-semibold mt-1 text-gray-800">
                                {result.data.priceLowerBound} - {result.data.priceUpperBound}
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-600">Target Range</Label>
                              <div className="flex items-center mt-1">
                                <p
                                  className={`text-lg font-semibold ${
                                    result.data.targetLowerBound === "Invalid Input" ? "text-red-600" : "text-gray-800"
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
                              <Label className="text-sm font-medium text-gray-600">Stop Loss Range</Label>
                              <div className="flex items-center mt-1">
                                <p
                                  className={`text-lg font-semibold ${
                                    result.data.stoplossLowerBound === "Invalid Input"
                                      ? "text-red-600"
                                      : "text-gray-800"
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
                <Card className="shadow-lg border border-gray-200 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg text-gray-800">
                      <Sparkles className="mr-2 h-5 w-5 text-blue-600" />
                      Example Trade Calls
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Try these examples to see how the AI parser works
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-3 flex items-center text-sm text-gray-800">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        Valid Examples
                      </h4>
                      <div className="space-y-2">
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="p-3">
                            <code className="text-sm text-green-800">
                              Buy NIFTY 23000 CE monthly @160 target 200/20 SL 120/110
                            </code>
                          </CardContent>
                        </Card>
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="p-3">
                            <code className="text-sm text-green-800">
                              Sell TATAMOTORS at 1500 with target 240/120 and SL 1480/70
                            </code>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3 flex items-center text-sm text-gray-800">
                        <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                        Invalid Examples
                      </h4>
                      <div className="space-y-2">
                        <Card className="bg-red-50 border-red-200">
                          <CardContent className="p-3">
                            <code className="text-sm text-red-800">Buy SBIN @600 target 610/590 SL 595/605</code>
                            <p className="text-xs text-red-600 mt-1">Invalid target range for Buy</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Analytics Preview */}
                <Card className="shadow-lg border border-gray-200 bg-white">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-gray-800 flex items-center">
                        <BarChart3 className="mr-2 h-5 w-5 text-blue-600" />
                        Quick Analytics
                      </CardTitle>
                      <Link href="/analytics">
                        <Button variant="outline" size="sm" className="border-gray-200 hover:bg-gray-50 bg-transparent">
                          View All
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Zap className="h-4 w-4 mr-2 text-green-600" />
                          <span className="text-sm text-gray-600">AI Accuracy</span>
                        </div>
                        <span className="font-semibold text-green-600">98.5%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-blue-600" />
                          <span className="text-sm text-gray-600">Processing Speed</span>
                        </div>
                        <span className="font-semibold text-blue-600">{"<2s"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 mr-2 text-purple-600" />
                          <span className="text-sm text-gray-600">Validation Rules</span>
                        </div>
                        <span className="font-semibold text-purple-600">15+</span>
                      </div>
                      <div className="pt-2 border-t">
                        <Link href="/analytics">
                          <Button variant="ghost" size="sm" className="w-full hover:bg-gray-50">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            View Detailed Analytics
                          </Button>
                        </Link>
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
