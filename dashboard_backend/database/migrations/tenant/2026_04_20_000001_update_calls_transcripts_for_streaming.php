<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('calls_transcripts', function (Blueprint $table) {
            $table->string('segment_id')->nullable()->after('call_id');
            $table->unsignedInteger('sequence')->default(0)->after('timestamp_ms');
            $table->boolean('is_final')->default(false)->after('sequence');
            $table->jsonb('metadata')->nullable()->after('is_final');

            $table->index(['call_id', 'segment_id']);
            $table->index(['call_id', 'sequence']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('calls_transcripts', function (Blueprint $table) {
            $table->dropIndex(['call_id', 'segment_id']);
            $table->dropIndex(['call_id', 'sequence']);
            $table->dropColumn([
                'segment_id',
                'sequence',
                'is_final',
                'metadata',
            ]);
        });
    }
};
