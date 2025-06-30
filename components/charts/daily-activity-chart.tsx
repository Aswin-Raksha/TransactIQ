"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface DailyActivityData {
  date: string
  total: number
  buy: number
  sell: number
}

interface DailyActivityChartProps {
  data: DailyActivityData[]
}

export function DailyActivityChart({ data }: DailyActivityChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorBuy" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="colorSell" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" tickFormatter={formatDate} className="text-xs fill-muted-foreground" />
        <YAxis className="text-xs fill-muted-foreground" />
        <Tooltip
          labelFormatter={(value) => formatDate(value as string)}
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            color: "hsl(var(--card-foreground))",
          }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="buy"
          stackId="1"
          stroke="#10b981"
          fillOpacity={1}
          fill="url(#colorBuy)"
          name="Buy Orders"
        />
        <Area
          type="monotone"
          dataKey="sell"
          stackId="1"
          stroke="#ef4444"
          fillOpacity={1}
          fill="url(#colorSell)"
          name="Sell Orders"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
