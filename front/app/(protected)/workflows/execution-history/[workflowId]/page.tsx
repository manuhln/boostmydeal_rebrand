"use client"

import { useState, use, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
  AlertCircle,
  Clock,
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { useWorkflow, useWorkflowExecutions } from "@/hooks/use-workflow"
import {
  WORKFLOW_TRIGGER_TYPES,
  type WorkflowExecution,
  type WorkflowExecutionStatus,
} from "@/lib/types"

// TODO(workflow-executions-enrichment): backend /workflows/{id}/executions currently
// returns raw executions without relations. To restore assistant name + caller phone
// number in this page, eager-load `call.agent` and `call.phoneNumber` in
// WorkflowController@executions and extend the WorkflowExecution frontend type.

const STATUS_FILTERS: { value: "all" | WorkflowExecutionStatus; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "running", label: "Running" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
]

function formatTriggerType(value?: string | null) {
  if (!value) return "—"
  const match = WORKFLOW_TRIGGER_TYPES.find((t) => t.value === value)
  return match ? match.label : value.replace(/_/g, " ")
}

function computeDurationSeconds(execution: WorkflowExecution): number | null {
  if (!execution.started_at || !execution.completed_at) return null
  const start = new Date(execution.started_at).getTime()
  const end = new Date(execution.completed_at).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null
  return Math.round((end - start) / 1000)
}

function extractErrorMessage(error?: Record<string, unknown> | null): string | null {
  if (!error) return null
  if (typeof error.message === "string" && error.message.trim().length > 0) {
    return error.message
  }
  return JSON.stringify(error)
}

function ExecutionStatusBadge({ status }: { status: WorkflowExecutionStatus }) {
  switch (status) {
    case "completed":
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      )
    case "failed":
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      )
    case "running":
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Running
        </Badge>
      )
    case "pending":
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      )
    default:
      return null
  }
}

function ExecutionRow({
  execution,
  triggerType,
}: {
  execution: WorkflowExecution
  triggerType?: string | null
}) {
  const [isOpen, setIsOpen] = useState(false)
  const duration = computeDurationSeconds(execution)
  const errorMessage = extractErrorMessage(execution.error_message)
  const startedAt = execution.started_at ?? execution.created_at

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <TableRow className="hover:bg-muted/50">
          <TableCell className="font-mono text-sm">{execution.id.slice(-8)}</TableCell>
          <TableCell className="font-mono text-xs text-muted-foreground">
            {execution.call_id ? execution.call_id.slice(-8) : "—"}
          </TableCell>
          <TableCell>
            <Badge variant="secondary">{formatTriggerType(triggerType)}</Badge>
          </TableCell>
          <TableCell>
            <ExecutionStatusBadge status={execution.status} />
          </TableCell>
          <TableCell>{duration !== null ? `${duration}s` : "—"}</TableCell>
          <TableCell className="text-muted-foreground">
            {startedAt ? formatDistanceToNow(new Date(startedAt), { addSuffix: true }) : "—"}
          </TableCell>
          <TableCell>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>
          </TableCell>
        </TableRow>
        <CollapsibleContent asChild>
          <TableRow className="bg-muted/30">
            <TableCell colSpan={7} className="p-4">
              <div className="space-y-4">
                {errorMessage && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-600">Error</p>
                      <p className="text-sm text-red-600/80 break-all">{errorMessage}</p>
                    </div>
                  </div>
                )}
                {execution.input_data && Object.keys(execution.input_data).length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Input data</p>
                    <pre className="p-3 rounded-lg bg-muted text-sm overflow-x-auto">
                      {JSON.stringify(execution.input_data, null, 2)}
                    </pre>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium mb-2">Output data</p>
                  <pre className="p-3 rounded-lg bg-muted text-sm overflow-x-auto">
                    {execution.output_data
                      ? JSON.stringify(execution.output_data, null, 2)
                      : "—"}
                  </pre>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium">Started at:</span>{" "}
                    {execution.started_at
                      ? format(new Date(execution.started_at), "PPpp")
                      : "—"}
                  </div>
                  <div>
                    <span className="font-medium">Completed at:</span>{" "}
                    {execution.completed_at
                      ? format(new Date(execution.completed_at), "PPpp")
                      : "—"}
                  </div>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </CollapsibleContent>
    </Collapsible>
  )
}

export default function WorkflowExecutionHistoryPage({
  params,
}: {
  params: Promise<{ workflowId: string }>
}) {
  const { workflowId } = use(params)
  const [statusFilter, setStatusFilter] = useState<"all" | WorkflowExecutionStatus>("all")
  const [page, setPage] = useState(1)

  const { data: workflow } = useWorkflow(workflowId)
  const { data: executionsResponse, isLoading } = useWorkflowExecutions(workflowId, {
    status: statusFilter === "all" ? undefined : statusFilter,
    page,
  })

  const executions = executionsResponse?.data ?? []

  const { totalExecutions, completedCount, failedCount, runningCount } = useMemo(() => {
    return {
      totalExecutions: executionsResponse?.total ?? 0,
      completedCount: executions.filter((e) => e.status === "completed").length,
      failedCount: executions.filter((e) => e.status === "failed").length,
      runningCount: executions.filter((e) => e.status === "running").length,
    }
  }, [executions, executionsResponse?.total])

  const currentPage = executionsResponse?.current_page ?? 1
  const lastPage = executionsResponse?.last_page ?? 1

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="space-y-4">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/workflows">
            <ArrowLeft className="w-4 h-4" />
            Back to Workflows
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Execution History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {workflow?.name ?? "Loading…"}{" "}
            <span className="font-mono text-xs">({workflowId.slice(-8)})</span>
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Executions</p>
                <p className="text-2xl font-semibold">{totalExecutions}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Play className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Successful (page)</p>
                <p className="text-2xl font-semibold text-green-600">{completedCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed (page)</p>
                <p className="text-2xl font-semibold text-red-600">{failedCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Running (page)</p>
                <p className="text-2xl font-semibold text-blue-600">{runningCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as "all" | WorkflowExecutionStatus)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Executions Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Execution ID</TableHead>
                <TableHead>Call ID</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Started</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell colSpan={7} className="py-3">
                      <div className="h-12 bg-muted animate-pulse rounded" />
                    </TableCell>
                  </TableRow>
                ))
              ) : executions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No executions yet
                  </TableCell>
                </TableRow>
              ) : (
                executions.map((execution) => (
                  <ExecutionRow
                    key={execution.id}
                    execution={execution}
                    triggerType={workflow?.trigger_type}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {lastPage}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={currentPage >= lastPage}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
