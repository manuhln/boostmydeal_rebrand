"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  BookOpen, Plus, Search, FileText, Globe, Link2,
  MoreVertical, Trash2, Database, Loader2, Pencil,
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  useKnowledgeBases, useCreateKnowledgeBase, useUpdateKnowledgeBase, useDeleteKnowledgeBase,
} from "@/hooks/use-knowledge-base"
import type { KnowledgeBase, KnowledgeBasePayload } from "@/lib/types"

const DOCUMENT_TYPES = ["pdf", "txt", "docx", "url", "csv", "html", "other"] as const

const docTypeIcon = (type: string) => (type === "url" ? Globe : FileText)

const docTypeBadgeClass = (type: string) => {
  const map: Record<string, string> = {
    pdf: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    url: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    txt: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    docx: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    csv: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    html: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  }
  return map[type] ?? "bg-muted text-muted-foreground"
}

const emptyPayload: KnowledgeBasePayload = { name: "", document_type: "pdf", description: "", document_url: "" }

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingKb, setEditingKb] = useState<KnowledgeBase | null>(null)
  const [deletingKb, setDeletingKb] = useState<KnowledgeBase | null>(null)
  const [form, setForm] = useState<KnowledgeBasePayload>(emptyPayload)

  const { data, isLoading } = useKnowledgeBases()
  const createKb = useCreateKnowledgeBase()
  const updateKb = useUpdateKnowledgeBase()
  const deleteKb = useDeleteKnowledgeBase()

  const knowledgeBases = data?.data ?? []

  const filtered = searchQuery
    ? knowledgeBases.filter(
        (kb) =>
          kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          kb.document_type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : knowledgeBases

  const openCreate = () => {
    setEditingKb(null)
    setForm(emptyPayload)
    setIsDialogOpen(true)
  }

  const openEdit = (kb: KnowledgeBase) => {
    setEditingKb(kb)
    setForm({
      name: kb.name,
      document_type: kb.document_type,
      description: kb.description ?? "",
      document_url: kb.document_url ?? "",
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!form.name.trim() || !form.document_type) return
    const payload: KnowledgeBasePayload = {
      name: form.name,
      document_type: form.document_type,
      description: form.description || undefined,
      document_url: form.document_url || undefined,
    }
    if (editingKb) {
      updateKb.mutate(
        { id: editingKb.id, data: payload },
        { onSuccess: () => { setIsDialogOpen(false); setEditingKb(null) } }
      )
    } else {
      createKb.mutate(payload, { onSuccess: () => setIsDialogOpen(false) })
    }
  }

  const isPending = createKb.isPending || updateKb.isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground mt-1">Train your AI agents with your business data</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Knowledge Base
        </Button>
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
                <p className="text-2xl font-semibold">{knowledgeBases.filter((kb) => kb.document_url).length}</p>
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
                <p className="text-sm text-muted-foreground">URL Sources</p>
                <p className="text-2xl font-semibold">{knowledgeBases.filter((kb) => kb.document_type === "url").length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-green-500" />
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
                const Icon = docTypeIcon(kb.document_type)
                return (
                  <div
                    key={kb.id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center border shrink-0">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-foreground">{kb.name}</h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {kb.description && (
                            <span className="text-xs text-muted-foreground truncate max-w-xs">{kb.description}</span>
                          )}
                          {kb.document_url && (
                            <a
                              href={kb.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-primary hover:underline truncate max-w-xs"
                            >
                              <Link2 className="w-3 h-3 shrink-0" />
                              {kb.document_url}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant="secondary" className={docTypeBadgeClass(kb.document_type)}>
                        {kb.document_type.toUpperCase()}
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingKb ? "Edit Knowledge Base" : "Create Knowledge Base"}</DialogTitle>
            <DialogDescription>
              {editingKb ? "Update the knowledge base details." : "Add a new knowledge base to train your AI agents."}
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
              <Label>Document Type *</Label>
              <Select
                value={form.document_type}
                onValueChange={(v) => setForm((f) => ({ ...f, document_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label>Document URL</Label>
              <Input
                type="url"
                placeholder="https://example.com/document.pdf"
                value={form.document_url}
                onChange={(e) => setForm((f) => ({ ...f, document_url: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.name.trim() || !form.document_type || isPending}>
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
