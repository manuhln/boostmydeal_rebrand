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
        Schema::table('knowledge_bases', function(Blueprint $table){
            // Temporary fields for processing pipeline
            $table->text('extracted_text')->nullable()->after('last_processed_at');
            $table->json('chunks')->nullable()->after('extracted_text');
            $table->json('embedding_points')->nullable()->after('chunks');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('knowledge_bases', function (Blueprint $table) {
            $table->dropColumn([
                'extracted_text',
                'chunks',
                'embedding_points',
            ]);
        });
    }
};
