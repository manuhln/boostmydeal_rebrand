<?php

use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowNode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
});

it('replaces the node graph of a workflow', function () {
    $workflow = Workflow::factory()->create();

    // Seed with an old node that should be wiped by the replace-all semantics.
    WorkflowNode::factory()->for($workflow)->create();

    $id1 = (string) Str::uuid();
    $id2 = (string) Str::uuid();
    $id3 = (string) Str::uuid();

    $payload = [
        'nodes' => [
            [
                'id' => $id1,
                'node_type' => 'trigger',
                'name' => 'Start',
                'position_x' => 0,
                'position_y' => 0,
                'next_node_id' => $id2,
            ],
            [
                'id' => $id2,
                'node_type' => 'condition',
                'name' => 'Branch',
                'position_x' => 200,
                'position_y' => 0,
                'true_node_id' => $id3,
                'false_node_id' => null,
            ],
            [
                'id' => $id3,
                'node_type' => 'email_tool',
                'name' => 'Notify',
                'position_x' => 400,
                'position_y' => 0,
                'config' => ['recipient' => 'a@b.c'],
            ],
        ],
    ];

    $res = $this->putJson("/api/v1/workflows/{$workflow->id}/graph", $payload);

    $res->assertOk();
    expect($workflow->nodes()->count())->toBe(3);

    $trigger = $workflow->nodes()->where('id', $id1)->first();
    expect($trigger->next_node_id)->toBe($id2);

    $branch = $workflow->nodes()->where('id', $id2)->first();
    expect($branch->true_node_id)->toBe($id3);
    expect($branch->false_node_id)->toBeNull();

    $email = $workflow->nodes()->where('id', $id3)->first();
    expect($email->config)->toBe(['recipient' => 'a@b.c']);
});

it('rejects a pointer that does not reference a payload node', function () {
    $workflow = Workflow::factory()->create();
    $orphanId = (string) Str::uuid();

    $payload = [
        'nodes' => [[
            'id' => (string) Str::uuid(),
            'node_type' => 'trigger',
            'name' => 'Start',
            'position_x' => 0,
            'position_y' => 0,
            'next_node_id' => $orphanId,
        ]],
    ];

    $res = $this->putJson("/api/v1/workflows/{$workflow->id}/graph", $payload);

    $res->assertStatus(422);
    expect($workflow->fresh()->nodes()->count())->toBe(0);
});

it('rejects an invalid node_type via enum validation', function () {
    $workflow = Workflow::factory()->create();

    $payload = [
        'nodes' => [[
            'id' => (string) Str::uuid(),
            'node_type' => 'banana',
            'name' => 'X',
            'position_x' => 0,
            'position_y' => 0,
        ]],
    ];

    $this->putJson("/api/v1/workflows/{$workflow->id}/graph", $payload)
        ->assertStatus(422)
        ->assertJsonValidationErrors(['nodes.0.node_type']);
});
