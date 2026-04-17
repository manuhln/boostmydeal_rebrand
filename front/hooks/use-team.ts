import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api-client"
import { queryKey } from "../lib/query-keys"
import type { TeamMember, TeamInvitation } from "../lib/types"

// ============================================
// Team Services
// ============================================

export const useTeamMembers = () => {
  return useQuery({
    queryKey: queryKey.Team.members(),
    queryFn: () => api.get("/team/members"),
  })
}

export const useTeamInvitations = () => {
  return useQuery({
    queryKey: queryKey.Team.invitations(),
    queryFn: () => api.get("/team/invitations"),
  })
}

export const useTeamMember = (id: string) => {
  return useQuery({
    queryKey: queryKey.Team.memberDetail(id),
    queryFn: () => api.get(`/team/members/${id}`),
    enabled: !!id,
  })
}

export const useInviteTeamMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { email: string; role: "admin" | "user" }) =>
      api.post("/team/invite", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.Team.invitations() })
    },
  })
}

export const useAcceptInvitation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (token: string) => api.post("/team/accept-invitation", { token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.Team.members() })
      queryClient.invalidateQueries({ queryKey: queryKey.Team.invitations() })
    },
  })
}

export const useRemoveTeamMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (memberId: string) => api.delete(`/team/members/${memberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.Team.members() })
    },
  })
}

export const useCancelInvitation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) => api.delete(`/team/invitations/${invitationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.Team.invitations() })
    },
  })
}

export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: "admin" | "user" }) =>
      api.patch(`/team/members/${memberId}/role`, { role }),
    onSuccess: (_, { memberId }) => {
      queryClient.invalidateQueries({ queryKey: queryKey.Team.memberDetail(memberId) })
      queryClient.invalidateQueries({ queryKey: queryKey.Team.members() })
    },
  })
}
