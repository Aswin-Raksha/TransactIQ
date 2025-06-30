"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProfessionalNavigation } from "@/components/professional-navigation"
import { TradeHistorySidebar } from "@/components/trade-history-sidebar"
import { DailyActivityChart } from "@/components/charts/daily-activity-chart"
import { TransactionTypeChart } from "@/components/charts/transaction-type-chart"
import { SymbolFrequencyChart } from "@/components/charts/symbol-frequency-chart"
import { MonthlyTrendsChart } from "@/components/charts/monthly-trends-chart"
import { ProcessingTimeChart } from "@/components/charts/processing-time-chart"
import { useAuth } from "@/lib/auth-context"
import { BarChart3, TrendingUp, Target, Clock, CheckCircle, AlertCircle, Activity, Loader2 } from "lucide-react"

interface AnalyticsData {
  totalTradeCalls: number
  recentTradeCalls: number
  transactionTypeBreakdown: Array<{ type: string; count: number }>
  symbolFrequency: Array<{ symbol: string; count: number }>
  dailyActivity: Array<{ date: string; total: number; buy: number; sell: number }>
  validationStats: { total: number; validTargets: number; validStopLoss: number }
  monthlyTrends: Array<{ month: string; total: number; buy: number; sell: number }>
  processingTimeData: Array<{ timeRange: string; count: number }>
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchAnalytics()
    }
  }, [user])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/analytics", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTradeCall = () => {
    setSidebarOpen(false)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!user || !analyticsData) {
    return null
  }

  const validationSuccessRate =
    analyticsData.validationStats.total > 0
      ? (
          ((analyticsData.validationStats.validTargets + analyticsData.validationStats.validStopLoss) /
            (analyticsData.validationStats.total * 2)) *
          100
        ).toFixed(1)
      : "0"

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
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Analytics Dashboard</h1>
              <p className="text-muted-foreground">
                Comprehensive insights into your trade call parsing performance and patterns
              </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Trade Calls</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.totalTradeCalls}</div>
                  <p className="text-xs text-muted-foreground">{analyticsData.recentTradeCalls} in last 30 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Validation Success</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{validationSuccessRate}%</div>
                  <p className="text-xs text-muted-foreground">Fields validated correctly</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Buy vs Sell</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsData.transactionTypeBreakdown.find((t) => t.type === "Buy")?.count || 0}:
                    {analyticsData.transactionTypeBreakdown.find((t) => t.type === "Sell")?.count || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Buy to Sell ratio</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{"<2s"}</div>
                  <p className="text-xs text-muted-foreground">AI processing time</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Daily Activity */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="mr-2 h-5 w-5 text-primary" />
                    Daily Activity (Last 30 Days)
                  </CardTitle>
                  <CardDescription>Trade call submissions over time with buy/sell breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <DailyActivityChart data={analyticsData.dailyActivity} />
                </CardContent>
              </Card>

              {/* Transaction Type Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="mr-2 h-5 w-5 text-primary" />
                    Transaction Types
                  </CardTitle>
                  <CardDescription>Distribution of buy vs sell orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <TransactionTypeChart data={analyticsData.transactionTypeBreakdown} />
                </CardContent>
              </Card>

              {/* Processing Time Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-primary" />
                    Processing Time
                  </CardTitle>
                  <CardDescription>AI processing speed distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProcessingTimeChart data={analyticsData.processingTimeData} />
                </CardContent>
              </Card>

              {/* Monthly Trends */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                    Monthly Trends (Last 6 Months)
                  </CardTitle>
                  <CardDescription>Long-term usage patterns and growth trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <MonthlyTrendsChart data={analyticsData.monthlyTrends} />
                </CardContent>
              </Card>

              {/* Symbol Frequency */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                    Most Traded Symbols
                  </CardTitle>
                  <CardDescription>Top 10 most frequently analyzed trading symbols</CardDescription>
                </CardHeader>
                <CardContent>
                  <SymbolFrequencyChart data={analyticsData.symbolFrequency} />
                </CardContent>
              </Card>
            </div>

            {/* Validation Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                    Validation Insights
                  </CardTitle>
                  <CardDescription>Field validation success rates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Target Fields</span>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">
                        {analyticsData.validationStats.total > 0
                          ? (
                              (analyticsData.validationStats.validTargets / analyticsData.validationStats.total) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </span>
                      <div className="w-20 h-2 bg-muted rounded-full">
                        <div
                          className="h-2 bg-green-600 rounded-full"
                          style={{
                            width: `${
                              analyticsData.validationStats.total > 0
                                ? (analyticsData.validationStats.validTargets / analyticsData.validationStats.total) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Stop Loss Fields</span>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">
                        {analyticsData.validationStats.total > 0
                          ? (
                              (analyticsData.validationStats.validStopLoss / analyticsData.validationStats.total) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </span>
                      <div className="w-20 h-2 bg-muted rounded-full">
                        <div
                          className="h-2 bg-green-600 rounded-full"
                          style={{
                            width: `${
                              analyticsData.validationStats.total > 0
                                ? (analyticsData.validationStats.validStopLoss / analyticsData.validationStats.total) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertCircle className="mr-2 h-5 w-5 text-orange-600" />
                    Performance Tips
                  </CardTitle>
                  <CardDescription>Recommendations to improve parsing accuracy</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <p className="font-medium mb-1">💡 Pro Tips:</p>
                    <ul className="text-muted-foreground space-y-1 text-xs">
                      <li>• Use clear price ranges (e.g., "200/20" instead of "200-220")</li>
                      <li>• Specify expiry dates explicitly when possible</li>
                      <li>• Include transaction type at the beginning</li>
                      <li>• Use standard symbol names (NIFTY, BANKNIFTY)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
