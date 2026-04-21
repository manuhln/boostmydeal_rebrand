"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  BookOpen, Plus, Search, FileText, MoreVertical, Trash2, Database,
  Loader2, Pencil, RefreshCw, Upload, Users, CheckCircle2, AlertCircle, Clock,
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  useKnowledgeBases, useCreateKnowledgeBase, useUpdateKnowledgeBase, useDeleteKnowledgeBase,
} from "@/hooks/use-knowledge-base"
import type { KnowledgeBase, ProcessingStatus } from "@/lib/types"

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

type FormState = { name: string; description: string }
const emptyForm: FormState = { name: "", description: "" }

const formatBytes = (bytes?: number | null) => {
  if (!bytes || bytes <= 0) return "—"
  const units = ["B", "KB", "MB", "GB"]
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
  return `${size.toFixed(size >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

const statusMeta = (status?: ProcessingStatus | null) => {
  switch (status) {
    case "processing":
      return { label: "Processing", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", Icon: Loader2, spin: true }
    case "completed":
      return { label: "Completed", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", Icon: CheckCircle2, spin: false }
    case "failed":
      return { label: "Failed", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", Icon: AlertCircle, spin: false }
    case "pending":
    default:
      return { label: status ? "Pending" : "No document", className: "bg-muted text-muted-foreground", Icon: Clock, spin: false }
  }
}

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingKb, setEditingKb] = useState<KnowledgeBase | null>(null)
  const [deletingKb, setDeletingKb] = useState<KnowledgeBase | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading, isFetching, refetch } = useKnowledgeBases()
  const createKb = useCreateKnowledgeBase()
  const updateKb = useUpdateKnowledgeBase()
  const deleteKb = useDeleteKnowledgeBase()

  const knowledgeBases = data?.data ?? []

  const filtered = searchQuery
    ? knowledgeBases.filter((kb) => kb.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : knowledgeBases

  const withDocCount = knowledgeBases.filter((kb) => !!kb.file_name).length
  const processingCount = knowledgeBases.filter(
    (kb) => kb.processing_status === "pending" || kb.processing_status === "processing"
  ).length

  const resetFormState = () => {
    setForm(emptyForm)
    setFile(null)
    setFileError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const openCreate = () => {
    setEditingKb(null)
    resetFormState()
    setIsDialogOpen(true)
  }

  const openEdit = (kb: KnowledgeBase) => {
    setEditingKb(kb)
    setForm({ name: kb.name, description: kb.description ?? "" })
    setFile(null)
    setFileError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    setIsDialogOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null
    if (!selected) { setFile(null); setFileError(null); return }
    if (selected.type !== "application/pdf") {
      setFileError("Only PDF files are accepted")
      setFile(null)
      return
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFileError("File must not exceed 50 MB")
      setFile(null)
      return
    }
    setFileError(null)
    setFile(selected)
  }

  const handleSubmit = () => {
    if (!form.name.trim()) return
    if (!editingKb && !file) return
    const basePayload = {
      name: form.name,
      description: form.description || undefined,
      ...(file ? { file } : {}),
    }
    if (editingKb) {
      updateKb.mutate(
        { id: editingKb.id, data: basePayload },
        { onSuccess: () => { setIsDialogOpen(false); setEditingKb(null); resetFormState() } }
      )
    } else {
      createKb.mutate(basePayload, {
        onSuccess: () => { setIsDialogOpen(false); resetFormState() },
      })
    }
  }

  const isPending = createKb.isPending || updateKb.isPending
  const canSubmit =
    !!form.name.trim() && !fileError && (editingKb ? true : !!file) && !isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground mt-1">Train your AI agents with your business data</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            New Knowledge Base
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bases</p>
                <p className="text-2xl font-semibold">{knowledgeBases.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">With Document</p>
                <p className="text-2xl font-semibold">{withDocCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-semibold">{processingCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Loader2 className={`w-5 h-5 text-amber-500 ${processingCount > 0 ? "animate-spin" : ""}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search knowledge bases..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Knowledge Bases</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                {searchQuery ? "No knowledge bases match your search" : "No knowledge bases yet"}
              </p>
              {!searchQuery && (
                <Button className="mt-4" onClick={openCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Knowledge Base
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((kb) => {
                const status = statusMeta(kb.processing_status)
                const StatusIcon = status.Icon
                return (
                  <div
                    key={kb.id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center border shrink-0">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-foreground">{kb.name}</h4>
                        <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-muted-foreground">
                          {kb.description && (
                            <span className="truncate max-w-xs">{kb.description}</span>
                          )}
                          {kb.file_name && (
                            <span className="flex items-center gap-1 truncate max-w-xs">
                              <FileText className="w-3 h-3 shrink-0" />
                              {kb.file_name}
                              <span className="opacity-70">({formatBytes(kb.file_size)})</span>
                            </span>
                          )}
                          {typeof kb.chunks_count === "number" && kb.chunks_count > 0 && (
                            <span>{kb.chunks_count} chunks</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {kb.agents_count ?? 0} {kb.agents_count === 1 ? "agent" : "agents"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant="secondary" className={status.className}>
                        <StatusIcon className={`w-3 h-3 mr-1 ${status.spin ? "animate-spin" : ""}`} />
                        {status.label}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openEdit(kb)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onSelect={() => setDeletingKb(kb)}>
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

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetFormState() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingKb ? "Edit Knowledge Base" : "Create Knowledge Base"}</DialogTitle>
            <DialogDescription>
              {editingKb
                ? "Update the knowledge base. Upload a new PDF to replace the existing document."
                : "Upload a PDF to train your AI agents with its content."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="e.g. Product Catalog"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Optional description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>PDF Document {editingKb ? "(optional — replaces current file)" : "*"}</Label>
              {editingKb?.file_name && !file && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Current: {editingKb.file_name} ({formatBytes(editingKb.file_size)})
                </p>
              )}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPending}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {file ? "Change file" : "Select PDF"}
                </Button>
                {file && (
                  <span className="text-xs text-muted-foreground truncate">
                    {file.name} ({formatBytes(file.size)})
                  </span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              {fileError && <p className="text-xs text-destructive">{fileError}</p>}
              <p className="text-xs text-muted-foreground">PDF only — max 50 MB.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetFormState() }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingKb ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingKb} onOpenChange={() => setDeletingKb(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Knowledge Base</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingKb?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteKb.isPending}
              onClick={() => {
                if (deletingKb) {
                  deleteKb.mutate(deletingKb.id, { onSuccess: () => setDeletingKb(null) })
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
