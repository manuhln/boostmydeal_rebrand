"use client"

import { useState } from "react"
import { Plus, Search, MoreHorizontal, Phone, BarChart3, Bot, Settings, Trash2, Copy, Cpu, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AgentForm } from "@/components/agents/agent-form"
import { useAgents, useCreateAgent, useUpdateAgent, useDeleteAgent } from "@/hooks/use-agents"
import { useDashboardMetrics } from "@/hooks/use-analytics"
import type { AIAgent, AgentFormData } from "@/lib/types"

// Maps AgentFormData (UI names) → backend snake_case payload
function agentFormDataToPayload(data: AgentFormData) {
  const isPipeline = data.modelProvider === "ChatGPT"
  const ttsProviderMap: Record<string, string> = {
    "ElevenLabs": "elevenlabs",
    "Rime": "rime",
    "StreamElements": "stream_elements",
    "Smallest AI": "smallest_ai",
  }
  const sttProviderMap: Record<string, string> = {
    "Deepgram": "deepgram",
    "OpenAI Whisper": "openai_whisper",
  }
  return {
    name: data.name,
    description: data.description || undefined,
    language: data.language,
    mode: isPipeline ? "pipeline" : "realtime",
    ...(isPipeline ? {
      llm_provider: "openai",
      llm_model: data.aiModel,
      stt_provider: sttProviderMap[data.transcriber] ?? "deepgram",
      tts_provider: ttsProviderMap[data.voiceProvider] ?? "elevenlabs",
      tts_voice: data.voice || undefined,
    } : {
      realtime_provider: "google_gemini",
      tts_voice: data.geminiLiveVoice || undefined,
    }),
    first_message: data.firstMessage || undefined,
    user_speaks_first: data.userSpeaksFirst,
    identity: data.identity || undefined,
    style: data.style || undefined,
    goal: data.goals || undefined,
    response_guideline: data.responseGuidelines || undefined,
    fallback: data.errorHandling || undefined,
    voicemail_message: data.voicemailMessage || undefined,
    temperature: data.temperature,
    call_recording: data.callRecording,
    recording_format: data.callRecordingFormat,
    remember_lead_preference: data.rememberLeadPreference,
    enable_human_transfer: data.enableCallTransfer,
    enable_background_sound: data.keyboardSound,
    enable_interruptions: true,
    enable_vad: true,
    phone_number_id: data.phoneNumberId || undefined,
  }
}

export default function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<AIAgent | undefined>(undefined)
  const [deletingAgent, setDeletingAgent] = useState<AIAgent | null>(null)

  const { data, isLoading } = useAgents()
  const { data: metrics } = useDashboardMetrics()
  const createAgent = useCreateAgent()
  const updateAgent = useUpdateAgent()
  const deleteAgent = useDeleteAgent()

  const agents = data?.data ?? []

  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (agent.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  )

  const handleCreateAgent = () => {
    setEditingAgent(undefined)
    setIsFormOpen(true)
  }

  const handleEditAgent = (agent: AIAgent) => {
    setEditingAgent(agent)
    setIsFormOpen(true)
  }

  const handleDuplicateAgent = (agent: AIAgent) => {
    const { id, created_at, updated_at, ...rest } = agent
    const payload = { ...rest, name: `${agent.name} (Copy)` }
    createAgent.mutate(payload as Parameters<typeof createAgent.mutate>[0])
  }

  const confirmDelete = () => {
    if (deletingAgent) {
      deleteAgent.mutate(deletingAgent.id, { onSuccess: () => setDeletingAgent(null) })
    }
  }

  const handleFormSubmit = (data: AgentFormData) => {
    const payload = agentFormDataToPayload(data)
    if (editingAgent) {
      updateAgent.mutate(
        { id: editingAgent.id, data: payload },
        { onSuccess: () => { setIsFormOpen(false); setEditingAgent(undefined) } }
      )
    } else {
      createAgent.mutate(
        payload as Parameters<typeof createAgent.mutate>[0],
        { onSuccess: () => setIsFormOpen(false) }
      )
    }
  }

  const isPending = createAgent.isPending || updateAgent.isPending

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Agents</h1>
          <p className="text-muted-foreground">Create and manage your AI voice agents</p>
        </div>
        <Button onClick={handleCreateAgent} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Create Agent
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "—" : agents.length}</div>
            <p className="text-xs text-muted-foreground">
              {agents.filter(a => a.mode === "pipeline").length} pipeline ·{" "}
              {agents.filter(a => a.mode === "realtime").length} realtime
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_calls ?? "—"}</div>
            <p className="text-xs text-muted-foreground">All agents combined</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.success_rate != null ? `${metrics.success_rate}%` : "—"}
            </div>
            <p className="text-xs text-muted-foreground">Across all agents</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search agents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Agents Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Card key={i} className="h-52 animate-pulse bg-muted" />)}
        </div>
      ) : filteredAgents.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Bot className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No agents found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchQuery ? "Try adjusting your search" : "Create your first AI agent to get started"}
          </p>
          {!searchQuery && (
            <Button className="mt-4" onClick={handleCreateAgent}>
              <Plus className="mr-2 h-4 w-4" />
              Create Agent
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => (
            <Card key={agent.id} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{agent.name}</CardTitle>
                      <Badge
                        variant="secondary"
                        className={agent.mode === "pipeline"
                          ? "mt-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "mt-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        }
                      >
                        {agent.mode}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditAgent(agent)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Edit Agent
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateAgent(agent)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeletingAgent(agent)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="mt-2 line-clamp-2">
                  {agent.description || "No description provided"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground truncate">
                      {agent.mode === "pipeline"
                        ? (agent.llm_model || "No model")
                        : (agent.realtime_provider || "Realtime")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mic className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground truncate">
                      {agent.tts_voice || agent.tts_provider || "No voice"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">
                    Lang: <span className="font-medium uppercase">{agent.language}</span>
                  </span>
                  <Button size="sm" variant="outline" onClick={() => handleEditAgent(agent)}>
                    <Settings className="mr-2 h-3 w-3" />
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Agent Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="w-full sm:max-w-2xl p-0 overflow-hidden">
          <AgentForm
            agent={editingAgent}
            onSubmit={handleFormSubmit}
            onCancel={() => { setIsFormOpen(false); setEditingAgent(undefined) }}
            isLoading={isPending}
          />
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingAgent} onOpenChange={() => setDeletingAgent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingAgent?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteAgent.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
