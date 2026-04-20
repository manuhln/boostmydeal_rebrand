"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PhoneIncoming, PhoneOutgoing, Clock, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useCalls } from "@/hooks/use-calls"

const statusConfig: Record<string, { label: string; className: string }> = {
  completed: { label: "Completed", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400" },
  answered: { label: "Answered", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400" },
  missed: { label: "Missed", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400" },
  cancelled: { label: "Cancelled", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400" },
  failed: { label: "Failed", className: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400" },
  in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400" },
  initiated: { label: "Initiated", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400" },
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function RecentCalls() {
  const { data, isLoading } = useCalls({ per_page: 5, sort: "-created_at" })
  const calls = data?.data ?? []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Recent Calls</CardTitle>
        <Link href="/calls">
          <Button variant="ghost" size="sm" className="text-sm gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : calls.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No recent calls</p>
        ) : (
          <div className="space-y-3">
            {calls.map((call) => {
              const config = statusConfig[call.status] ?? { label: call.status.replace("_", " "), className: "bg-gray-100 text-gray-800" }
              return (
                <div key={call.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {call.direction === "inbound"
                        ? <PhoneIncoming className="w-4 h-4 text-emerald-500" />
                        : <PhoneOutgoing className="w-4 h-4 text-blue-500" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium font-mono">{call.to_number}</p>
                      <p className="text-xs text-muted-foreground capitalize">{call.direction}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className={cn("text-xs", config.className)}>
                      {config.label}
                    </Badge>
                    {call.duration_seconds > 0 && (
                      <div className="flex items-center gap-1 mt-1 justify-end">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{formatDuration(call.duration_seconds)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
