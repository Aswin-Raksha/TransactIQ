"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Search, TrendingUp, TrendingDown, Calendar, Filter } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

interface TradeCall {
  _id: string
  originalInput: string
  parsedData: any
  createdAt: string
  userId: string
}

interface TradeHistorySidebarProps {
  isOpen: boolean
  onClose: () => void
  onSelectTradeCall: (tradeCall: TradeCall) => void
}

export function TradeHistorySidebar({ isOpen, onClose, onSelectTradeCall }: TradeHistorySidebarProps) {
  const [tradeCalls, setTradeCalls] = useState<TradeCall[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "buy" | "sell">("all")
  const { user } = useAuth()

  useEffect(() => {
    if (isOpen && user) {
      fetchTradeCalls()
    }
  }, [isOpen, user])

  const fetchTradeCalls = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/tradecalls", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setTradeCalls(data.tradeCalls || [])
      } else {
        toast.error("Failed to fetch trade history")
      }
    } catch (error) {
      toast.error("Network error occurred")
      console.error("Fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTradeCalls = tradeCalls.filter((tradeCall) => {
    const matchesSearch = tradeCall.originalInput.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter =
      filter === "all" ||
      (filter === "buy" && tradeCall.parsedData?.transType?.toLowerCase() === "buy") ||
      (filter === "sell" && tradeCall.parsedData?.transType?.toLowerCase() === "sell")

    return matchesSearch && matchesFilter
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
      {/* Overlay for mobile */}
      <div className="fixed inset-0 bg-black bg-opacity-50 lg:hidden" onClick={onClose} />

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-80 bg-white border-r border-gray-200 shadow-lg lg:relative lg:shadow-none z-50">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Trade History</h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="p-4 space-y-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search trade calls..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-200 focus:border-gray-400"
              />
            </div>

            <div className="flex space-x-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
                className={
                  filter === "all"
                    ? "bg-gray-800 hover:bg-gray-700 text-white"
                    : "border-gray-200 hover:bg-gray-50 text-gray-700"
                }
              >
                All
              </Button>
              <Button
                variant={filter === "buy" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("buy")}
                className={
                  filter === "buy"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "border-gray-200 hover:bg-gray-50 text-gray-700"
                }
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Buy
              </Button>
              <Button
                variant={filter === "sell" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("sell")}
                className={
                  filter === "sell"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "border-gray-200 hover:bg-gray-50 text-gray-700"
                }
              >
                <TrendingDown className="h-3 w-3 mr-1" />
                Sell
              </Button>
            </div>
          </div>

          {/* Trade Calls List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading...</p>
                </div>
              </div>
            ) : filteredTradeCalls.length === 0 ? (
              <div className="text-center py-8">
                <Filter className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No trade calls found</p>
                {searchTerm && <p className="text-gray-400 text-xs mt-1">Try adjusting your search or filter</p>}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTradeCalls.map((tradeCall) => (
                  <Card
                    key={tradeCall._id}
                    className="cursor-pointer hover:shadow-md transition-shadow border-gray-200 bg-white"
                    onClick={() => onSelectTradeCall(tradeCall)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={tradeCall.parsedData?.transType?.toLowerCase() === "buy" ? "default" : "destructive"}
                          className={
                            tradeCall.parsedData?.transType?.toLowerCase() === "buy"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }
                        >
                          {tradeCall.parsedData?.transType?.toLowerCase() === "buy" ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {tradeCall.parsedData?.transType || "Unknown"}
                        </Badge>
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(tradeCall.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-700 line-clamp-2 mb-2">{tradeCall.originalInput}</p>
                      {tradeCall.parsedData?.tradingSymbol && (
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="font-medium">{tradeCall.parsedData.tradingSymbol}</span>
                          {tradeCall.parsedData?.priceLowerBound && (
                            <span>₹{tradeCall.parsedData.priceLowerBound}</span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
