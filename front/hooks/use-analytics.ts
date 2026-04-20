import { useQuery } from "@tanstack/react-query"
import { api } from "../lib/api-client"
import { queryKey } from "../lib/query-keys"
import type { DashboardMetrics, CallEvolution, AgentStats, PhoneNumberStats } from "../lib/types"

type DateRangeParams = { start_date?: string; end_date?: string }

export const useDashboardMetrics = (params?: DateRangeParams) => {
  return useQuery({
    queryKey: queryKey.metrics.dashboard(params?.start_date, params?.end_date),
    queryFn: () => api.get<DashboardMetrics>("/dashboard/metrics", params),
  })
}

export const useCallEvolution = (params?: DateRangeParams & { group_by?: "hour" | "day" | "week" | "month" }) => {
  return useQuery({
    queryKey: queryKey.metrics.callEvolution(params?.start_date, params?.end_date, params?.group_by),
    queryFn: () => api.get<CallEvolution[]>("/dashboard/call-evolution", params),
  })
}

export const useAgentStats = (params?: DateRangeParams) => {
  return useQuery({
    queryKey: queryKey.metrics.agentStats(params?.start_date, params?.end_date),
    queryFn: () => api.get<AgentStats[]>("/dashboard/agent-stats", params),
  })
}

export const usePhoneNumberStats = (params?: DateRangeParams) => {
  return useQuery({
    queryKey: queryKey.metrics.phoneNumberStats(params?.start_date, params?.end_date),
    queryFn: () => api.get<PhoneNumberStats[]>("/dashboard/phone-number-stats", params),
  })
}
