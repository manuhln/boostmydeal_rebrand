"use client"

import { useState } from "react"
import {
  Search, Filter, Phone, PhoneIncoming, PhoneOutgoing,
  Play, Download, Plus, FileText, AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { TranscriptOverlay } from "@/components/calls/transcript-overlay"
import { cn } from "@/lib/utils"
import { useCalls, useStartCall } from "@/hooks/use-calls"
import { useAgents } from "@/hooks/use-agents"
import type { Call, CallStatus } from "@/lib/types"

const CALL_STATUSES: CallStatus[] = [
  "initiated", "in_progress", "completed", "cancelled",
  "missed", "answered", "unknown", "failed",
]

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleString("en-US", {
    month: "2-digit", day: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  })

const getStatusColor = (status: CallStatus) => {
  switch (status) {
    case "in_progress": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
    case "completed": case "answered": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    case "failed": case "cancelled": case "missed": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    case "initiated": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
    default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
  }
}

export default function CallLogsPage() {
  const [apiFilters, setApiFilters] = useState<{
    "filter[status]"?: CallStatus
    "filter[direction]"?: "inbound" | "outbound"
    "filter[agent_id]"?: string
  }>({})

  const [numberSearch, setNumberSearch] = useState("")
  const [pendingStatus, setPendingStatus] = useState("all")
  const [pendingDirection, setPendingDirection] = useState("all")
  const [pendingAgentId, setPendingAgentId] = useState("all")

  const [transcriptOverlay, setTranscriptOverlay] = useState<{
    isOpen: boolean; callId: string; status: string
  }>({ isOpen: false, callId: "", status: "" })

  const [isOutboundModalOpen, setIsOutboundModalOpen] = useState(false)
  const [outboundCallData, setOutboundCallData] = useState({
    agentId: "", toNumber: "", contactName: "",
  })

  const { data: callsData, isLoading } = useCalls({ ...apiFilters, per_page: 100 })
  const { data: agentsData } = useAgents()
  const startCall = useStartCall()

  const calls = callsData?.data ?? []
  const agents = agentsData?.data ?? []

  const filteredCalls = numberSearch
    ? calls.filter((c) =>
      c.to_number.includes(numberSearch) || c.from_number.includes(numberSearch)
    )
    : calls

  const totalCalls = filteredCalls.length
  const completedCalls = filteredCalls.filter((c) => c.status === "completed" || c.status === "answered").length
  const inProgressCalls = filteredCalls.filter((c) => c.status === "in_progress" || c.status === "initiated").length
  const failedCalls = filteredCalls.filter((c) => c.status === "failed" || c.status === "missed" || c.status === "cancelled").length

  const handleApplyFilters = () => {
    setApiFilters({
      ...(pendingStatus !== "all" ? { "filter[status]": pendingStatus as CallStatus } : {}),
      ...(pendingDirection !== "all" ? { "filter[direction]": pendingDirection as "inbound" | "outbound" } : {}),
      ...(pendingAgentId !== "all" ? { "filter[agent_id]": pendingAgentId } : {}),
    })
  }

  const handleClearFilters = () => {
    setPendingStatus("all")
    setPendingDirection("all")
    setPendingAgentId("all")
    setNumberSearch("")
    setApiFilters({})
  }

  const handleInitiateCall = () => {
    if (!outboundCallData.agentId || !outboundCallData.toNumber || !outboundCallData.contactName) return
    startCall.mutate(
      {
        agent_id: outboundCallData.agentId,
        to_number: outboundCallData.toNumber,
        contact_name: outboundCallData.contactName,
      },
      {
        onSuccess: () => {
          setOutboundCallData({ agentId: "", toNumber: "", contactName: "" })
          setIsOutboundModalOpen(false)
        },
      }
    )
  }

  const handleExport = () => {
    const csvContent =
      "ID,Direction,Status,From,To,Duration (s),Cost,Date\n" +
      filteredCalls
        .map((call: Call) =>
          `"${call.id}","${call.direction}","${call.status}","${call.from_number}","${call.to_number}","${call.duration_seconds}","${call.cost}","${formatDate(call.created_at)}"`
        )
        .join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "call_logs.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={cn("flex flex-col gap-6", transcriptOverlay.isOpen && "mr-[400px]")}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Call Logs</h1>
          <p className="text-muted-foreground">View and manage all AI agent calls</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setIsOutboundModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Outbound Call
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Calls", value: totalCalls, color: "text-muted-foreground" },
          { label: "Completed", value: completedCalls, color: "text-green-600" },
          { label: "In Progress", value: inProgressCalls, color: "text-orange-600" },
          { label: "Failed / Missed", value: failedCalls, color: "text-red-600" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Phone className={cn("h-4 w-4", color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "—" : value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Direction</Label>
              <Select value={pendingDirection} onValueChange={setPendingDirection}>
                <SelectTrigger><SelectValue placeholder="All Directions" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Directions</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Agent</Label>
              <Select value={pendingAgentId} onValueChange={setPendingAgentId}>
                <SelectTrigger><SelectValue placeholder="All Agents" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={String(agent.id)}>{agent.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={pendingStatus} onValueChange={setPendingStatus}>
                <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {CALL_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>{status.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberSearch">Search Number</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="numberSearch"
                  placeholder="+1 555..."
                  className="pl-9"
                  value={numberSearch}
                  onChange={(e) => setNumberSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <Button onClick={handleApplyFilters}>Apply Filters</Button>
            <Button variant="outline" onClick={handleClearFilters}>Clear</Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Direction</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recording</TableHead>
                <TableHead>Transcript</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredCalls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    No calls found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCalls.map((call) => (
                  <TableRow key={call.id} className="px-4 ">
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {call.direction === "inbound"
                          ? <PhoneIncoming className="h-4 w-4 text-emerald-500" />
                          : <PhoneOutgoing className="h-4 w-4 text-blue-500" />
                        }
                        <span className="capitalize text-sm">{call.direction}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{call.from_number}</TableCell>
                    <TableCell className="font-mono text-sm">{call.to_number}</TableCell>
                    <TableCell className="text-sm">{formatDate(call.created_at)}</TableCell>
                    <TableCell>{call.duration_seconds > 0 ? formatDuration(call.duration_seconds) : "—"}</TableCell>
                    <TableCell>{call.cost > 0 ? `$${(call.cost / 100).toFixed(4)}` : "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getStatusColor(call.status)}>
                        {call.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {call.recording_url ? (
                        <Button variant="ghost" size="sm" onClick={() => window.open(call.recording_url!, "_blank")}>
                          <Play className="h-4 w-4 mr-1" /> Play
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTranscriptOverlay({ isOpen: true, callId: call.id, status: call.status })}
                      >
                        <FileText className="h-4 w-4 mr-1" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Outbound Call Modal */}
      <Dialog open={isOutboundModalOpen} onOpenChange={setIsOutboundModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Outbound Call</DialogTitle>
            <DialogDescription>Initiate a new outbound call using an AI agent.</DialogDescription>
          </DialogHeader>
          {startCall.isError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {startCall.error instanceof Error ? startCall.error.message : "Failed to start call"}
            </div>
          )}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Agent</Label>
              <Select
                value={outboundCallData.agentId}
                onValueChange={(v) => setOutboundCallData((p) => ({ ...p, agentId: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Choose an agent" /></SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={String(agent.id)}>{agent.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To Number</Label>
              <Input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={outboundCallData.toNumber}
                onChange={(e) => setOutboundCallData((p) => ({ ...p, toNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Contact Name</Label>
              <Input
                placeholder="John Smith"
                value={outboundCallData.contactName}
                onChange={(e) => setOutboundCallData((p) => ({ ...p, contactName: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOutboundModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleInitiateCall}
              disabled={
                !outboundCallData.agentId ||
                !outboundCallData.toNumber ||
                !outboundCallData.contactName ||
                startCall.isPending
              }
            >
              {startCall.isPending ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Initiating...</>
              ) : (
                <><PhoneOutgoing className="mr-2 h-4 w-4" />Start Call</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TranscriptOverlay
        isOpen={transcriptOverlay.isOpen}
        onClose={() => setTranscriptOverlay((p) => ({ ...p, isOpen: false }))}
        callId={transcriptOverlay.callId}
        contactName={transcriptOverlay.callId}
        status={transcriptOverlay.status}
      />
    </div>
  )
}
