<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workflow_nodes', function (Blueprint $table) {
            $table->json('config')->nullable()->after('position_y');
            $table->json('conditions')->nullable()->after('config');
            $table->foreignUuid('true_node_id')->nullable()->after('next_node_id');
            $table->foreignUuid('false_node_id')->nullable()->after('true_node_id');
        });

        Schema::table('workflow_nodes', function (Blueprint $table) {
            $table->foreign('true_node_id')
                ->references('id')
                ->on('workflow_nodes')
                ->cascadeOnDelete();

            $table->foreign('false_node_id')
                ->references('id')
                ->on('workflow_nodes')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('workflow_nodes', function (Blueprint $table) {
            $table->dropForeign(['true_node_id']);
            $table->dropForeign(['false_node_id']);
            $table->dropColumn(['config', 'conditions', 'true_node_id', 'false_node_id']);
        });
    }
};
