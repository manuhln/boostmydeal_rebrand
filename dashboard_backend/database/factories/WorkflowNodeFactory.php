<?php

namespace Database\Factories;

use App\Enums\WorkflowNodeType;
use App\Models\Workflow;
use App\Models\WorkflowNode;
use Illuminate\Database\Eloquent\Factories\Factory;

class WorkflowNodeFactory extends Factory
{
    protected $model = WorkflowNode::class;

    public function definition(): array
    {
        return [
            'workflow_id' => Workflow::factory(),
            'node_type' => $this->faker->randomElement(WorkflowNodeType::cases())->value,
            'name' => $this->faker->words(2, true),
            'description' => $this->faker->optional()->sentence(),
            'position_x' => $this->faker->numberBetween(0, 800),
            'position_y' => $this->faker->numberBetween(0, 600),
        ];
    }
}
