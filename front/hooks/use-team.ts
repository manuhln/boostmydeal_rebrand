import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api } from "../lib/api-client"
import { ApiError } from "../lib/api-client"
import { queryKey } from "../lib/query-keys"
import type {
  TeamMember,
  TeamInvitation,
  TeamRole,
  UserApiItem,
  TenantInvitationApiItem,
  RoleIncluded,
} from "../lib/types"

type UsersListResponse = {
  data: UserApiItem[]
  included?: Array<RoleIncluded | { id: string; type: string; attributes: Record<string, unknown> }>
  meta?: unknown
  links?: unknown
}

type InvitationsListResponse = {
  data: TenantInvitationApiItem[]
  meta?: unknown
  links?: unknown
}

function resolveMemberRole(
  user: UserApiItem,
  included: UsersListResponse["included"],
): TeamRole | null {
  const rel = user.relationships?.roles?.data?.[0]
  if (!rel || !included) return null
  const roleEntry = included.find(
    (i) => i.type === "roles" && i.id === rel.id,
  ) as RoleIncluded | undefined
  return roleEntry?.attributes?.name ?? null
}

function flattenUser(user: UserApiItem, included: UsersListResponse["included"]): TeamMember {
  return {
    id: user.id,
    first_name: user.attributes.first_name,
    last_name: user.attributes.last_name,
    email: user.attributes.email,
    role: resolveMemberRole(user, included),
    created_at: user.attributes.created_at,
    updated_at: user.attributes.updated_at,
  }
}

function flattenInvitation(item: TenantInvitationApiItem): TeamInvitation {
  return { id: item.id, ...item.attributes }
}

export const useTeamMembers = (params?: {
  "filter[name]"?: string
  "filter[email]"?: string
  sort?: string
  page?: number
  per_page?: number
}) => {
  return useQuery({
    queryKey: queryKey.Team.members(),
    queryFn: () => api.get<UsersListResponse>("/users", params),
    select: (res) => ({
      ...res,
      data: res.data.map((u) => flattenUser(u, res.included)),
    }),
  })
}

export const useTeamMember = (id: string) => {
  return useQuery({
    queryKey: queryKey.Team.memberDetail(id),
    queryFn: () =>
      api.get<{ data: UserApiItem; included?: UsersListResponse["included"] }>(`/users/${id}`),
    select: (res): TeamMember => flattenUser(res.data, res.included),
    enabled: !!id,
  })
}

export const useTeamInvitations = (params?: {
  "filter[email]"?: string
  "filter[role]"?: TeamRole
  sort?: string
  page?: number
  per_page?: number
}) => {
  return useQuery({
    queryKey: queryKey.Team.invitations(),
    queryFn: () => api.get<InvitationsListResponse>("/invitations", params),
    select: (res) => ({
      ...res,
      data: res.data.map(flattenInvitation),
    }),
  })
}

export const useInviteTeamMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { email: string; role: TeamRole; name?: string }) =>
      api.post<{ data: TenantInvitationApiItem }>("/invitations", data),
    onSuccess: () => {
      toast.success("Invitation envoyée")
      queryClient.invalidateQueries({ queryKey: queryKey.Team.invitations() })
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 422) {
        toast.error(error.message || "Invitation impossible")
      }
    },
  })
}

export const useAcceptInvitation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) =>
      api.post<{ message: string; role: TeamRole }>(`/invitations/${invitationId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.Team.members() })
      queryClient.invalidateQueries({ queryKey: queryKey.Team.invitations() })
    },
  })
}

export const useRemoveTeamMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => api.delete<void>(`/users/${userId}`),
    onSuccess: () => {
      toast.success("Membre supprimé")
      queryClient.invalidateQueries({ queryKey: queryKey.Team.members() })
    },
    onError: (error, userId, _ctx) => {
      if (error instanceof ApiError && error.status === 403) {
        // Backend sends {error: "..."}; ApiError reads only data.message so we
        // map the 3 known cases manually. See UserController::destroy.
        toast.error(
          "Suppression impossible : vous ne pouvez pas vous supprimer vous-même, " +
            "supprimer le dernier Owner du tenant, ou vous n'avez pas la permission.",
        )
      }
      void userId
    },
  })
}

export const useCancelInvitation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) => api.delete<void>(`/invitations/${invitationId}`),
    onSuccess: () => {
      toast.success("Invitation annulée")
      queryClient.invalidateQueries({ queryKey: queryKey.Team.invitations() })
    },
  })
}
