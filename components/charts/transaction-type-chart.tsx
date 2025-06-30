"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface TransactionTypeData {
  type: string
  count: number
}

interface TransactionTypeChartProps {
  data: TransactionTypeData[]
}

const COLORS = {
  Buy: "#10b981",
  Sell: "#ef4444",
}

export function TransactionTypeChart({ data }: TransactionTypeChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0)

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null // Don't show label if less than 5%

    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-sm font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={100}
          fill="#8884d8"
          dataKey="count"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.type as keyof typeof COLORS] || "#6b7280"} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [value, "Count"]}
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            color: "hsl(var(--card-foreground))",
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
