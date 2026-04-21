import type { Edge, Node } from "reactflow"
import type { SaveWorkflowGraphPayload, WorkflowNodeType } from "./types"

// Convert React Flow nodes + edges into the backend graph payload.
// Pointers are encoded on each node: a non-handle edge sets `next_node_id`,
// a `sourceHandle === "true"` edge sets `true_node_id`,
// a `sourceHandle === "false"` edge sets `false_node_id`.
export function toBackendGraph(
  nodes: Node[],
  edges: Edge[]
): SaveWorkflowGraphPayload {
  const pointers = new Map<string, { next?: string; true?: string; false?: string }>()
  for (const edge of edges) {
    const current = pointers.get(edge.source) ?? {}
    if (edge.sourceHandle === "true") current.true = edge.target
    else if (edge.sourceHandle === "false") current.false = edge.target
    else current.next = edge.target
    pointers.set(edge.source, current)
  }

  return {
    nodes: nodes.map((n) => {
      const ptr = pointers.get(n.id) ?? {}
      const data = n.data as { label?: string; config?: Record<string, unknown> }
      return {
        id: n.id,
        node_type: n.type as WorkflowNodeType,
        name: data.label ?? "Untitled",
        position_x: Math.round(n.position.x),
        position_y: Math.round(n.position.y),
        config: data.config ?? null,
        next_node_id: ptr.next ?? null,
        true_node_id: ptr.true ?? null,
        false_node_id: ptr.false ?? null,
      }
    }),
  }
}
