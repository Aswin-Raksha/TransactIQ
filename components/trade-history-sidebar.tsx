"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Search, X, Calendar, TrendingUp, TrendingDown, Clock, ChevronDown, ChevronRight } from "lucide-react"

interface TradeCall {
  _id: string
  transType: string
  tradingSymbol: string
  originalInput: string
  createdAt: string
  targetLowerBound: string
  targetUpperBound: string
  stoplossLowerBound: string
  stoplossUpperBound: string
}

interface TradeHistorySidebarProps {
  isOpen: boolean
  onClose: () => void
  onSelectTradeCall: (tradeCall: TradeCall) => void
}

export function TradeHistorySidebar({ isOpen, onClose, onSelectTradeCall }: TradeHistorySidebarProps) {
  const [tradeCalls, setTradeCalls] = useState<TradeCall[]>([])
  const [filteredTradeCalls, setFilteredTradeCalls] = useState<TradeCall[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<"all" | "buy" | "sell">("all")
  const [loading, setLoading] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["today"]))

  useEffect(() => {
    if (isOpen) {
      fetchTradeCalls()
    }
  }, [isOpen])

  useEffect(() => {
    filterTradeCalls()
  }, [tradeCalls, searchQuery, selectedFilter])

  const fetchTradeCalls = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/tradecalls?limit=50", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setTradeCalls(data.tradeCalls)
      }
    } catch (error) {
      console.error("Failed to fetch trade calls:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterTradeCalls = () => {
    let filtered = tradeCalls

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (call) =>
          call.tradingSymbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          call.originalInput.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filter by transaction type
    if (selectedFilter !== "all") {
      filtered = filtered.filter((call) => call.transType.toLowerCase() === selectedFilter)
    }

    setFilteredTradeCalls(filtered)
  }

  const groupTradeCallsByDate = (calls: TradeCall[]) => {
    const groups: { [key: string]: TradeCall[] } = {}
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    calls.forEach((call) => {
      const callDate = new Date(call.createdAt)
      const callDateStr = callDate.toDateString()
      const todayStr = today.toDateString()
      const yesterdayStr = yesterday.toDateString()

      let groupKey: string
      if (callDateStr === todayStr) {
        groupKey = "today"
      } else if (callDateStr === yesterdayStr) {
        groupKey = "yesterday"
      } else {
        groupKey = callDate.toLocaleDateString()
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(call)
    })

    return groups
  }

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey)
    } else {
      newExpanded.add(groupKey)
    }
    setExpandedGroups(newExpanded)
  }

  const groupedTradeCalls = groupTradeCallsByDate(filteredTradeCalls)

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full w-80 bg-sidebar-background border-r border-sidebar-border z-50 transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:relative lg:translate-x-0 lg:z-auto",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            <h2 className="text-lg font-semibold text-sidebar-foreground">Trade History</h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="lg:hidden">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="p-4 space-y-3 border-b border-sidebar-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search trade calls..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-sidebar-accent border-sidebar-border"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={selectedFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("all")}
                className="flex-1"
              >
                All
              </Button>
              <Button
                variant={selectedFilter === "buy" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("buy")}
                className="flex-1"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Buy
              </Button>
              <Button
                variant={selectedFilter === "sell" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("sell")}
                className="flex-1"
              >
                <TrendingDown className="h-3 w-3 mr-1" />
                Sell
              </Button>
            </div>
          </div>

          {/* Trade Calls List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                Loading trade calls...
              </div>
            ) : Object.keys(groupedTradeCalls).length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No trade calls found
              </div>
            ) : (
              <div className="p-2">
                {Object.entries(groupedTradeCalls).map(([groupKey, calls]) => (
                  <div key={groupKey} className="mb-4">
                    <button
                      onClick={() => toggleGroup(groupKey)}
                      className="flex items-center w-full px-2 py-1 text-sm font-medium text-muted-foreground hover:text-sidebar-foreground transition-colors"
                    >
                      {expandedGroups.has(groupKey) ? (
                        <ChevronDown className="h-3 w-3 mr-1" />
                      ) : (
                        <ChevronRight className="h-3 w-3 mr-1" />
                      )}
                      {groupKey === "today" ? "Today" : groupKey === "yesterday" ? "Yesterday" : groupKey}
                      <span className="ml-auto text-xs">({calls.length})</span>
                    </button>

                    {expandedGroups.has(groupKey) && (
                      <div className="mt-2 space-y-1">
                        {calls.map((call) => (
                          <button
                            key={call._id}
                            onClick={() => onSelectTradeCall(call)}
                            className="w-full p-3 text-left rounded-lg hover:bg-sidebar-accent transition-colors group"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Badge
                                variant={call.transType.toLowerCase() === "buy" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {call.transType}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(call.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <div className="font-medium text-sm text-sidebar-foreground mb-1">{call.tradingSymbol}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2">{call.originalInput}</div>
                            <div className="flex items-center mt-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              Target: {call.targetLowerBound}-{call.targetUpperBound}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
