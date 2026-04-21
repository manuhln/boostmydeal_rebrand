"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { WorkflowEditor } from "@/components/workflows/workflow-editor"
import type { Node, Edge } from "reactflow"
import { useCreateWorkflow, useSaveWorkflowGraph } from "@/hooks/use-workflow"
import { toBackendGraph } from "@/lib/workflow-graph"

export default function CreateWorkflowPage() {
  const router = useRouter()
  const [workflowName, setWorkflowName] = useState("Untitled Workflow")
  const createMutation = useCreateWorkflow()
  const saveGraphMutation = useSaveWorkflowGraph()

  const handleSave = async (nodes: Node[], edges: Edge[]) => {
    if (!workflowName.trim()) return
    try {
      const res = await createMutation.mutateAsync({ name: workflowName })
      if (nodes.length > 0) {
        await saveGraphMutation.mutateAsync({
          id: res.workflow.id,
          data: toBackendGraph(nodes, edges),
        })
      }
      router.push("/workflows")
    } catch (err) {
      console.error("Failed to save workflow:", err)
    }
  }

  const isSaving = createMutation.isPending || saveGraphMutation.isPending

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Button variant="ghost" asChild className="gap-2">
        <Link href="/workflows">
          <ArrowLeft className="w-4 h-4" />
          Back to Workflows
        </Link>
      </Button>

      {/* Editor */}
      <WorkflowEditor
        workflowName={workflowName}
        onWorkflowNameChange={setWorkflowName}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  )
}
