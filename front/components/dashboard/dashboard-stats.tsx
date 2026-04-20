"use client"

import { Card } from "@/components/ui/card"
import { Phone, PhoneIncoming, PhoneOff, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDashboardMetrics } from "@/hooks/use-analytics"

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

function StatCard({
  title, value, icon: Icon, iconBg, iconColor, loading,
}: {
  title: string
  value: string
  icon: typeof Phone
  iconBg: string
  iconColor: string
  loading?: boolean
}) {
  return (
    <Card className="p-5 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          {loading ? (
            <div className="h-8 w-20 bg-muted animate-pulse rounded mt-1" />
          ) : (
            <p className="text-2xl font-bold mt-1">{value}</p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", iconBg)}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
      </div>
    </Card>
  )
}

export function DashboardStats() {
  const { data, isLoading } = useDashboardMetrics()
  const metrics = data

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Calls"
        value={metrics ? String(metrics.total_calls) : "—"}
        icon={Phone}
        iconBg="bg-primary/10"
        iconColor="text-primary"
        loading={isLoading}
      />
      <StatCard
        title="Successful Calls"
        value={metrics ? String(metrics.completed_calls) : "—"}
        icon={PhoneIncoming}
        iconBg="bg-emerald-500/10"
        iconColor="text-emerald-500"
        loading={isLoading}
      />
      <StatCard
        title="Missed / Failed"
        value={metrics ? String(metrics.missed_calls + metrics.failed_calls) : "—"}
        icon={PhoneOff}
        iconBg="bg-red-500/10"
        iconColor="text-red-500"
        loading={isLoading}
      />
      <StatCard
        title="Avg Duration"
        value={metrics ? formatDuration(metrics.average_duration) : "—"}
        icon={Clock}
        iconBg="bg-blue-500/10"
        iconColor="text-blue-500"
        loading={isLoading}
      />
    </div>
  )
}
