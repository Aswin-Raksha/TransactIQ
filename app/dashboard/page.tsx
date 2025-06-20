"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { TrendingUp, Users, Target, DollarSign } from "lucide-react"
import type { EnrichmentMetrics } from "@/lib/types"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<EnrichmentMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/metrics")
      const data = await response.json()
      setMetrics(data)
    } catch (error) {
      console.error("Failed to fetch metrics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const categoryData = metrics
    ? Object.entries(metrics.categoryBreakdown).map(([name, value]) => ({
        name,
        value,
      }))
    : []

  const vendorData = metrics
    ? Object.entries(metrics.vendorFrequency).map(([name, value]) => ({
        name,
        value,
      }))
    : []

  const enrichmentRate = metrics ? (metrics.enrichedRecords / metrics.totalRecords) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Insights and metrics from your AI-enriched spend data</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalRecords || 0}</div>
              <p className="text-xs text-muted-foreground">Spend transactions processed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enriched Records</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.enrichedRecords || 0}</div>
              <p className="text-xs text-muted-foreground">{enrichmentRate.toFixed(1)}% enrichment rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{((metrics?.averageConfidence || 0) * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">AI classification accuracy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categoryData.length}</div>
              <p className="text-xs text-muted-foreground">Unique spend categories</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Spend by Category</CardTitle>
              <CardDescription>Distribution of spend across different procurement categories</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <ChartContainer
                  config={{
                    value: {
                      label: "Records",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No category data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Vendors</CardTitle>
              <CardDescription>Most frequent vendors in your spend data</CardDescription>
            </CardHeader>
            <CardContent>
              {vendorData.length > 0 ? (
                <ChartContainer
                  config={{
                    value: {
                      label: "Transactions",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vendorData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="var(--color-value)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">No vendor data available</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Enrichment Quality Insights</CardTitle>
            <CardDescription>Analysis of AI enrichment performance and data quality</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{enrichmentRate.toFixed(1)}%</div>
                <p className="text-sm text-gray-600">Records Successfully Enriched</p>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {((metrics?.averageConfidence || 0) * 100).toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600">Average AI Confidence Score</p>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">{categoryData.length}</div>
                <p className="text-sm text-gray-600">Distinct Categories Identified</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h4 className="font-semibold mb-3">Quality Indicators</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-green-700 border-green-200">
                  High Confidence Classifications
                </Badge>
                <Badge variant="outline" className="text-blue-700 border-blue-200">
                  Vendor Normalization Active
                </Badge>
                <Badge variant="outline" className="text-purple-700 border-purple-200">
                  Description Enhancement
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
