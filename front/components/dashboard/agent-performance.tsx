"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Bot, ArrowRight, TrendingUp, Phone } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAgentStats } from "@/hooks/use-analytics"

export function AgentPerformance() {
  const { data, isLoading } = useAgentStats()
  const agents = data ?? []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Agent Performance</CardTitle>
        <Link href="/agents">
          <Button variant="ghost" size="sm" className="text-sm gap-1">
            Manage Agents <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No agent data available</p>
        ) : (
          <div className="space-y-4">
            {agents.map((agent) => {
              const successRate = agent.total_calls > 0
                ? Math.round((agent.completed_calls / agent.total_calls) * 100)
                : 0

              return (
                <div key={agent.id} className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Bot className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{agent.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{agent.total_calls} calls</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className={cn("font-semibold", successRate >= 50 ? "text-emerald-500" : "text-muted-foreground")}>
                        {successRate}%
                      </span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className="font-medium">{successRate}%</span>
                    </div>
                    <Progress value={successRate} className="h-1.5" />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>{agent.completed_calls} completed</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{agent.missed_calls} missed</span>
                    </div>
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
