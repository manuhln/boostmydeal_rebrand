<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\WorkflowExecutionStatus;
use App\Enums\WorkflowNodeType;
use App\Enums\WorkflowTriggerType;
use App\Models\Workflow;
use App\Models\WorkflowExecution;
use App\Models\WorkflowNode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * @authenticated
 *
 * @group Workflows
 */
class WorkflowController extends Controller
{
    /**
     * List all workflows
     *
     * @authenticated
     *
     * @queryParam is_active bool optional Filter by active status
     * @queryParam trigger_type string optional Filter by trigger type (phone_call_connected, transcript_complete, call_summary, etc.)
     * @queryParam per_page int optional Items per page (default: 15)
     *
     * @response {"data": [{"id": 1, "name": "Follow-up Workflow", "is_active": true}], "meta": {...}}
     */
    public function index(Request $request): JsonResponse
    {
        $workflows = Workflow::query()
            ->when($request->has('is_active'), function ($query) use ($request) {
                $query->where('is_active', $request->boolean('is_active'));
            })
            ->when($request->has('trigger_type'), function ($query) use ($request) {
                $query->where('trigger_type', $request->input('trigger_type'));
            })
            ->with(['nodes'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 15));

        return response()->json($workflows);
    }

    /**
     * Store a new workflow
     *
     * @authenticated
     *
     * @bodyParam name string required Workflow name
     * @bodyParam description string optional Workflow description
     * @bodyParam is_active bool optional Initial active status (default: false)
     * @bodyParam trigger_type string optional Trigger type (phone_call_connected, transcript_complete, call_summary, phone_call_ended, live_transcript, manual)
     * @bodyParam trigger_config array optional Trigger configuration
     *
     * @response {"message": "Workflow created successfully", "workflow": {...}}
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'sometimes|boolean',
            'trigger_type' => ['nullable', Rule::enum(WorkflowTriggerType::class)],
            'trigger_config' => 'nullable|array',
        ]);

        $workflow = Workflow::create($validated);

        return response()->json([
            'message' => 'Workflow created successfully',
            'workflow' => $workflow->load('nodes'),
        ], 201);
    }

    /**
     * Get a specific workflow
     *
     * @authenticated
     *
     * @urlParam workflow int required The ID of the workflow
     *
     * @response {"workflow": {"id": 1, "name": "Follow-up Workflow", "nodes": [...]}}
     */
    public function show(Workflow $workflow): JsonResponse
    {
        $workflow->load(['nodes' => function ($query) {
            $query->orderBy('position_x', 'asc');
        }]);

        return response()->json(['workflow' => $workflow]);
    }

    /**
     * Update a workflow
     *
     * @authenticated
     *
     * @urlParam workflow int required The ID of the workflow
     *
     * @bodyParam name string optional Workflow name
     * @bodyParam description string optional Workflow description
     * @bodyParam is_active bool optional Active status
     * @bodyParam trigger_type string optional Trigger type
     * @bodyParam trigger_config array optional Trigger configuration
     *
     * @response {"message": "Workflow updated successfully", "workflow": {...}}
     */
    public function update(Request $request, Workflow $workflow): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'sometimes|boolean',
            'trigger_type' => ['nullable', Rule::enum(WorkflowTriggerType::class)],
            'trigger_config' => 'nullable|array',
        ]);

        $workflow->update($validated);

        return response()->json([
            'message' => 'Workflow updated successfully',
            'workflow' => $workflow->load('nodes'),
        ]);
    }

    /**
     * Delete a workflow
     *
     * @authenticated
     *
     * @urlParam workflow int required The ID of the workflow
     *
     * @response 204
     */
    public function destroy(Workflow $workflow): JsonResponse
    {
        $workflow->delete();

        return response()->json(null, 204);
    }

    /**
     * Get workflow execution history
     *
     * @authenticated
     *
     * @urlParam workflow int required The ID of the workflow
     *
     * @queryParam status string optional Filter by execution status
     * @queryParam per_page int optional Items per page (default: 15)
     *
     * @response {"data": [{"id": 1, "status": "completed", "created_at": "2024-01-01T00:00:00Z"}], "meta": {...}}
     */
    public function executions(Request $request, Workflow $workflow): JsonResponse
    {
        $executions = $workflow->executions()
            ->when($request->has('status'), function ($query) use ($request) {
                $query->where('status', $request->input('status'));
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 15));

        return response()->json($executions);
    }

    /**
     * Trigger a workflow manually
     *
     * @authenticated
     *
     * @urlParam workflow int required The ID of the workflow
     *
     * @bodyParam input_data array optional Input data for the workflow
     * @bodyParam call_id string optional Call ID to associate with the execution
     *
     * @response {"message": "Workflow triggered successfully", "execution": {...}}
     */
    public function trigger(Request $request, Workflow $workflow): JsonResponse
    {
        $validated = $request->validate([
            'input_data' => 'sometimes|array',
            'call_id' => 'sometimes|uuid|exists:calls,id',
        ]);

        $execution = WorkflowExecution::create([
            'workflow_id' => $workflow->id,
            'call_id' => $validated['call_id'] ?? null,
            'status' => WorkflowExecutionStatus::PENDING->value,
            'input_data' => $validated['input_data'] ?? [],
        ]);

        // Dispatch job to execute workflow
        dispatch(function () use ($execution) {
            $execution->markAsRunning();
            // TODO: Implement workflow execution logic
            // For now, mark as completed
            $execution->markAsCompleted([
                'message' => 'Workflow execution completed',
                'timestamp' => now()->toIso8601String(),
            ]);
        });

        return response()->json([
            'message' => 'Workflow triggered successfully',
            'execution' => $execution,
        ], 201);
    }

    /**
     * Activate a workflow
     *
     * @authenticated
     *
     * @urlParam workflow int required The ID of the workflow
     *
     * @response {"message": "Workflow activated successfully", "workflow": {...}}
     */
    public function activate(Workflow $workflow): JsonResponse
    {
        $workflow->activate();

        return response()->json([
            'message' => 'Workflow activated successfully',
            'workflow' => $workflow,
        ]);
    }

    /**
     * Deactivate a workflow
     *
     * @authenticated
     *
     * @urlParam workflow int required The ID of the workflow
     *
     * @response {"message": "Workflow deactivated successfully", "workflow": {...}}
     */
    public function deactivate(Workflow $workflow): JsonResponse
    {
        $workflow->deactivate();

        return response()->json([
            'message' => 'Workflow deactivated successfully',
            'workflow' => $workflow,
        ]);
    }

    /**
     * Replace the full node graph of a workflow (replace-all semantics).
     *
     * @authenticated
     *
     * @urlParam workflow string required The UUID of the workflow
     *
     * @bodyParam nodes array required The complete list of nodes for this workflow
     *
     * @response {"message": "Workflow graph updated successfully", "workflow": {...}}
     */
    public function updateGraph(Request $request, Workflow $workflow): JsonResponse
    {
        $validated = $request->validate([
            'nodes' => 'required|array',
            'nodes.*.id' => 'required|uuid',
            'nodes.*.node_type' => ['required', Rule::enum(WorkflowNodeType::class)],
            'nodes.*.name' => 'required|string|max:255',
            'nodes.*.description' => 'nullable|string|max:1000',
            'nodes.*.position_x' => 'required|integer',
            'nodes.*.position_y' => 'required|integer',
            'nodes.*.config' => 'nullable|array',
            'nodes.*.conditions' => 'nullable|array',
            'nodes.*.next_node_id' => 'nullable|uuid',
            'nodes.*.true_node_id' => 'nullable|uuid',
            'nodes.*.false_node_id' => 'nullable|uuid',
        ]);

        // Every pointer must reference an id present in the same payload.
        $nodeIds = collect($validated['nodes'])->pluck('id')->all();
        foreach ($validated['nodes'] as $node) {
            foreach (['next_node_id', 'true_node_id', 'false_node_id'] as $pointer) {
                if (! empty($node[$pointer]) && ! in_array($node[$pointer], $nodeIds, true)) {
                    return response()->json([
                        'message' => "Node {$node['id']} references a missing node via {$pointer}.",
                    ], 422);
                }
            }
        }

        DB::transaction(function () use ($workflow, $validated) {
            $workflow->nodes()->delete();

            // Pass 1: insert nodes without pointers so FK constraints don't fire.
            foreach ($validated['nodes'] as $node) {
                WorkflowNode::forceCreate([
                    'id' => $node['id'],
                    'workflow_id' => $workflow->id,
                    'node_type' => $node['node_type'],
                    'name' => $node['name'],
                    'description' => $node['description'] ?? null,
                    'position_x' => $node['position_x'],
                    'position_y' => $node['position_y'],
                    'config' => $node['config'] ?? null,
                    'conditions' => $node['conditions'] ?? null,
                ]);
            }

            // Pass 2: resolve pointers now that every row exists.
            foreach ($validated['nodes'] as $node) {
                WorkflowNode::where('id', $node['id'])->update([
                    'next_node_id' => $node['next_node_id'] ?? null,
                    'true_node_id' => $node['true_node_id'] ?? null,
                    'false_node_id' => $node['false_node_id'] ?? null,
                ]);
            }
        });

        return response()->json([
            'message' => 'Workflow graph updated successfully',
            'workflow' => $workflow->fresh(['nodes']),
        ]);
    }
}
