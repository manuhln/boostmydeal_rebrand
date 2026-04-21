"use client"

import { useState } from "react"
import { Plus, Search, MoreHorizontal, Mail, Shield, User, UserCog, Trash2, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useTeamMembers,
  useTeamInvitations,
  useInviteTeamMember,
  useRemoveTeamMember,
  useCancelInvitation,
} from "@/hooks/use-team"
import type { TeamRole } from "@/lib/types"

const roleColors: Record<TeamRole, string> = {
  Owner: "bg-primary/10 text-primary",
  Admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Member: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
}

const roleIcons: Record<TeamRole, React.ReactNode> = {
  Owner: <Shield className="h-3 w-3 mr-1" />,
  Admin: <UserCog className="h-3 w-3 mr-1" />,
  Member: <User className="h-3 w-3 mr-1" />,
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })

const fullName = (first: string | null, last: string | null, fallback: string) => {
  const n = [first, last].filter(Boolean).join(" ").trim()
  return n || fallback
}

const initials = (first: string | null, last: string | null, fallback: string) => {
  const f = first?.[0] ?? ""
  const l = last?.[0] ?? ""
  return (f + l).toUpperCase() || fallback[0]?.toUpperCase() || "?"
}

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteName, setInviteName] = useState("")
  const [inviteRole, setInviteRole] = useState<TeamRole>("Member")

  const { data: membersData, isLoading: membersLoading } = useTeamMembers()
  const { data: invitationsData, isLoading: invitationsLoading } = useTeamInvitations()

  const members = membersData?.data ?? []
  const invitations = invitationsData?.data ?? []

  const inviteMutation = useInviteTeamMember()
  const removeMutation = useRemoveTeamMember()
  const cancelMutation = useCancelInvitation()

  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase()
    return (
      fullName(m.first_name, m.last_name, m.email).toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    )
  })

  const filteredInvitations = invitations.filter((inv) => {
    const q = searchQuery.toLowerCase()
    return inv.email.toLowerCase().includes(q) || (inv.name ?? "").toLowerCase().includes(q)
  })

  const handleSendInvite = () => {
    if (!inviteEmail.trim()) return
    inviteMutation.mutate(
      { email: inviteEmail.trim(), role: inviteRole, name: inviteName.trim() || undefined },
      {
        onSuccess: () => {
          setIsInviteDialogOpen(false)
          setInviteEmail("")
          setInviteName("")
          setInviteRole("Member")
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
          <p className="text-muted-foreground">Manage your team members and permissions</p>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>Send an invitation to join your organization</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invite-name">Name (optional)</Label>
                <Input
                  id="invite-name"
                  placeholder="Jane Doe"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as TeamRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Member">Member</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Admins can manage team members and settings. Members can use all features.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSendInvite}
                disabled={inviteMutation.isPending || !inviteEmail.trim()}
              >
                <Send className="mr-2 h-4 w-4" />
                {inviteMutation.isPending ? "Sending..." : "Send Invite"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">Active accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invitations.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {members.filter((m) => m.role === "Owner" || m.role === "Admin").length}
            </div>
            <p className="text-xs text-muted-foreground">Owners + Admins</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabs: Members / Invitations */}
      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">
            Members
            <Badge variant="secondary" className="ml-2 h-5 px-1.5">
              {members.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Pending invitations
            <Badge variant="secondary" className="ml-2 h-5 px-1.5">
              {invitations.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden md:table-cell">Joined</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membersLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Loading members...
                      </TableCell>
                    </TableRow>
                  ) : filteredMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No members found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMembers.map((member) => {
                      const displayName = fullName(member.first_name, member.last_name, member.email)
                      return (
                        <TableRow className="px-4 " key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback>
                                  {initials(member.first_name, member.last_name, member.email)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{displayName}</p>
                                <p className="text-sm text-muted-foreground">{member.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {member.role ? (
                              <Badge variant="secondary" className={roleColors[member.role]}>
                                {roleIcons[member.role]}
                                {member.role}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {formatDate(member.created_at)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {/* Change Role: backend endpoint not yet available — kept as disabled placeholder */}
                                <DropdownMenuItem disabled>
                                  <UserCog className="mr-2 h-4 w-4" />
                                  Change Role
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  disabled={member.role === "Owner" || removeMutation.isPending}
                                  onClick={() => removeMutation.mutate(member.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden md:table-cell">Invited</TableHead>
                    <TableHead className="hidden md:table-cell">Expires</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitationsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Loading invitations...
                      </TableCell>
                    </TableRow>
                  ) : filteredInvitations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No pending invitations
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvitations.map((inv) => (
                      <TableRow className="px-4 " key={inv.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{inv.name ?? inv.email}</p>
                            {inv.name && (
                              <p className="text-sm text-muted-foreground">{inv.email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={roleColors[inv.role]}>
                            {roleIcons[inv.role]}
                            {inv.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {formatDate(inv.created_at)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {formatDate(inv.expires_at)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={cancelMutation.isPending}
                            onClick={() => cancelMutation.mutate(inv.id)}
                            title="Cancel invitation"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Roles Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Role Permissions</CardTitle>
          <CardDescription>Understanding team member roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Badge variant="secondary" className={roleColors.Owner}>
                {roleIcons.Owner}Owner
              </Badge>
              <p className="text-sm text-muted-foreground">
                Full access to all features, billing, and team management
              </p>
            </div>
            <div className="space-y-2">
              <Badge variant="secondary" className={roleColors.Admin}>
                {roleIcons.Admin}Admin
              </Badge>
              <p className="text-sm text-muted-foreground">
                Manage team members, agents, and integrations
              </p>
            </div>
            <div className="space-y-2">
              <Badge variant="secondary" className={roleColors.Member}>
                {roleIcons.Member}Member
              </Badge>
              <p className="text-sm text-muted-foreground">
                Use all features, view reports, manage own settings
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
