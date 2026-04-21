<?php

namespace Database\Factories;

use App\Enums\WorkflowTriggerType;
use App\Models\Workflow;
use Illuminate\Database\Eloquent\Factories\Factory;

class WorkflowFactory extends Factory
{
    protected $model = Workflow::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->sentence(3),
            'description' => $this->faker->optional()->sentence(),
            'is_active' => true,
            'trigger_type' => $this->faker->randomElement(WorkflowTriggerType::cases())->value,
            'trigger_config' => [],
        ];
    }
}
