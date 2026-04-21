"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { WorkflowEditor } from "@/components/workflows/workflow-editor"
import type { Node, Edge } from "reactflow"
import { useSaveWorkflowGraph, useUpdateWorkflow, useWorkflow } from "@/hooks/use-workflow"
import type { WorkflowNode } from "@/lib/types"
import { toBackendGraph } from "@/lib/workflow-graph"

// Convert a backend WorkflowNode (flat shape: node_type, position_x/y, name) into a
// React Flow Node (nested shape: type, position: {x,y}, data: {label, config}).
const toReactFlowNode = (node: WorkflowNode): Node => ({
  id: node.id,
  type: node.node_type,
  position: { x: node.position_x, y: node.position_y },
  data: {
    label: node.name,
    // TODO(workflow-graph-persistence): backend migration doesn't store `config` yet.
    config: {},
  },
})

// Backend has no `edges` table — topology is encoded as `next_node_id` pointers on each node.
// Derive edges from those pointers for the initial React Flow view.
const deriveEdges = (nodes: WorkflowNode[]): Edge[] =>
  nodes
    .filter((n) => !!n.next_node_id)
    .map((n) => ({
      id: `${n.id}->${n.next_node_id}`,
      source: n.id,
      target: n.next_node_id as string,
      animated: true,
    }))

export default function EditWorkflowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [workflowName, setWorkflowName] = useState("")

  const { data: workflow, isLoading } = useWorkflow(id)
  const updateMutation = useUpdateWorkflow()
  const saveGraphMutation = useSaveWorkflowGraph()

  // Prefill the editable name once the workflow is loaded.
  useEffect(() => {
    if (workflow) setWorkflowName(workflow.name)
  }, [workflow])

  const handleSave = async (nodes: Node[], edges: Edge[]) => {
    if (!workflowName.trim()) return
    try {
      await updateMutation.mutateAsync({ id, data: { name: workflowName } })
      await saveGraphMutation.mutateAsync({
        id,
        data: toBackendGraph(nodes, edges),
      })
      router.push("/workflows")
    } catch (err) {
      console.error("Failed to update workflow:", err)
    }
  }

  const isSaving = updateMutation.isPending || saveGraphMutation.isPending

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/workflows">
            <ArrowLeft className="w-4 h-4" />
            Back to Workflows
          </Link>
        </Button>
        <div className="flex items-center justify-center h-[calc(100vh-300px)]">
          <p className="text-muted-foreground">Workflow not found</p>
        </div>
      </div>
    )
  }

  const initialNodes: Node[] = (workflow.nodes ?? []).map(toReactFlowNode)
  const initialEdges: Edge[] = deriveEdges(workflow.nodes ?? [])

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
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        workflowName={workflowName}
        onWorkflowNameChange={setWorkflowName}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  )
}
