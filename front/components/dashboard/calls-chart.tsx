"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useMemo } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useCallEvolution } from "@/hooks/use-analytics"
import { subDays, format } from "date-fns"

export function CallsChart() {
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly")

  const params = useMemo(() => {
    const end = new Date()
    const start = subDays(end, period === "weekly" ? 7 : 30)
    return {
      start_date: start.toISOString().split("T")[0],
      end_date: end.toISOString().split("T")[0],
      group_by: period === "weekly" ? "day" as const : "week" as const,
    }
  }, [period])

  const { data, isLoading } = useCallEvolution(params)

  const chartData = useMemo(() =>
    (data ?? []).map((point) => ({
      name: period === "weekly"
        ? format(new Date(point.date), "EEE")
        : format(new Date(point.date), "MMM d"),
      completed: point.completed_calls,
      missed: point.missed_calls,
    })),
    [data, period]
  )

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Call Activity</CardTitle>
        <Select value={period} onValueChange={(v) => setPeriod(v as "weekly" | "monthly")}>
          <SelectTrigger className="w-32 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">This Week</SelectItem>
            <SelectItem value="monthly">This Month</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          {isLoading ? (
            <div className="h-full w-full bg-muted animate-pulse rounded" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="missedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Area type="monotone" dataKey="completed" name="Completed" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#completedGradient)" />
                <Area type="monotone" dataKey="missed" name="Missed" stroke="hsl(0, 84%, 60%)" strokeWidth={2} fill="url(#missedGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
