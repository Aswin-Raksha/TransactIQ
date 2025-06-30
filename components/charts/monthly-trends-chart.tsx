"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface MonthlyTrendsData {
  month: string
  total: number
  buy: number
  sell: number
}

interface MonthlyTrendsChartProps {
  data: MonthlyTrendsData[]
}

export function MonthlyTrendsChart({ data }: MonthlyTrendsChartProps) {
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1)
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="month" tickFormatter={formatMonth} className="text-xs fill-muted-foreground" />
        <YAxis className="text-xs fill-muted-foreground" />
        <Tooltip
          labelFormatter={(value) => formatMonth(value as string)}
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            color: "hsl(var(--card-foreground))",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="total"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ fill: "hsl(var(--primary))" }}
          name="Total"
        />
        <Line
          type="monotone"
          dataKey="buy"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ fill: "#10b981" }}
          name="Buy Orders"
        />
        <Line
          type="monotone"
          dataKey="sell"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ fill: "#ef4444" }}
          name="Sell Orders"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
