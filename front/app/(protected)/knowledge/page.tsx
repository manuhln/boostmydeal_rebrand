"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  BookOpen, Plus, Search, FileText, Globe, Upload,
  MoreVertical, CheckCircle2, Clock, AlertCircle, Trash2, Database, Loader2,
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useKnowledgeBases, useCreateKnowledgeBase, useDeleteKnowledgeBase, useUploadDocument,
} from "@/hooks/use-knowledge-base"

const typeIcon = (type: string) => (type === "url" ? Globe : FileText)

const statusBadgeClass = (status: string) => {
  if (status === "ready") return "bg-green-500/10 text-green-600"
  if (status === "processing") return "bg-yellow-500/10 text-yellow-600"
  return "bg-red-500/10 text-red-600"
}

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "ready") return <CheckCircle2 className="w-3 h-3 mr-1" />
  if (status === "processing") return <Clock className="w-3 h-3 mr-1" />
  return <AlertCircle className="w-3 h-3 mr-1" />
}

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newKbName, setNewKbName] = useState("")
  const [newKbDesc, setNewKbDesc] = useState("")
  const [selectedKbId, setSelectedKbId] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useKnowledgeBases()
  const createKb = useCreateKnowledgeBase()
  const deleteKb = useDeleteKnowledgeBase()
  const uploadDoc = useUploadDocument()

  const knowledgeBases = data?.data ?? []

  const filtered = searchQuery
    ? knowledgeBases.filter((kb) => kb.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : knowledgeBases

  const handleCreate = () => {
    if (!newKbName.trim()) return
    createKb.mutate(
      { name: newKbName, description: newKbDesc || undefined },
      {
        onSuccess: () => {
          setNewKbName("")
          setNewKbDesc("")
          setIsCreateOpen(false)
        },
      }
    )
  }

  const handleFileUpload = (kbId: string, file: File) => {
    uploadDoc.mutate({ knowledgeBaseId: kbId, file })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground mt-1">Train your AI agents with your business data</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              New Knowledge Base
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Knowledge Base</DialogTitle>
              <DialogDescription>Give your knowledge base a name and optionally a description</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input placeholder="e.g. Product Catalog" value={newKbName} onChange={(e) => setNewKbName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input placeholder="Optional description" value={newKbDesc} onChange={(e) => setNewKbDesc(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newKbName.trim() || createKb.isPending}>
                {createKb.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Bases</p><p className="text-2xl font-semibold">{knowledgeBases.length}</p></div><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><BookOpen className="w-5 h-5 text-primary" /></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Documents</p><p className="text-2xl font-semibold">{knowledgeBases.reduce((s, kb) => s + (kb.documents?.length ?? 0), 0)}</p></div><div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Database className="w-5 h-5 text-blue-500" /></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Ready</p><p className="text-2xl font-semibold">{knowledgeBases.filter((kb) => kb.documents?.every((d) => d.status === "ready")).length}</p></div><div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-green-500" /></div></div></CardContent></Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search knowledge bases..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      {/* List */}
      <Card>
        <CardHeader><CardTitle className="text-base">Knowledge Bases</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No knowledge bases yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((kb) => {
                const docCount = kb.documents?.length ?? 0
                const allReady = docCount > 0 && kb.documents?.every((d) => d.status === "ready")
                const hasProcessing = kb.documents?.some((d) => d.status === "processing")
                const status = allReady ? "ready" : hasProcessing ? "processing" : docCount === 0 ? "empty" : "ready"

                return (
                  <div key={kb.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center border">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{kb.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          {kb.description && <span className="text-xs text-muted-foreground">{kb.description}</span>}
                          <span className="text-xs text-muted-foreground">{docCount} document{docCount !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {status !== "empty" && (
                        <Badge variant="secondary" className={statusBadgeClass(status)}>
                          <StatusIcon status={status} />
                          {status}
                        </Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => { setSelectedKbId(kb.id); fileInputRef.current?.click() }}>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Document
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-500"
                            onSelect={() => deleteKb.mutate(kb.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.txt"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file && selectedKbId) handleFileUpload(selectedKbId, file)
          e.target.value = ""
        }}
      />
    </div>
  )
}
