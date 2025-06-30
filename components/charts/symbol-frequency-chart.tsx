"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface SymbolFrequencyData {
  symbol: string
  count: number
}

interface SymbolFrequencyChartProps {
  data: SymbolFrequencyData[]
}

export function SymbolFrequencyChart({ data }: SymbolFrequencyChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="symbol" className="text-xs fill-muted-foreground" angle={-45} textAnchor="end" height={80} />
        <YAxis className="text-xs fill-muted-foreground" />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            color: "hsl(var(--card-foreground))",
          }}
        />
        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
