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
        Schema::table('call_events', function (Blueprint $table) {
            $table->string('source_event_id')->nullable()->after('call_id');
            $table->index(['call_id', 'source_event_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('call_events', function (Blueprint $table) {
            $table->dropIndex(['call_id', 'source_event_id']);
            $table->dropColumn('source_event_id');
        });
    }
};
