<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('knowledge_bases', function (Blueprint $table) {
            $table->string('file_path')->nullable()->after('document_type');
            $table->string('file_name')->nullable()->after('file_path');
            $table->unsignedBigInteger('file_size')->nullable()->after('file_name');
            $table->enum('processing_status', ['pending', 'processing', 'completed', 'failed'])->default('pending')->after('file_size');
            $table->integer('chunks_count')->default(0)->after('processing_status');
            $table->timestamp('last_processed_at')->nullable()->after('chunks_count');
        });
    }

    public function down(): void
    {
        Schema::table('knowledge_bases', function (Blueprint $table) {
            $table->dropColumn([
                'file_path',
                'file_name',
                'file_size',
                'processing_status',
                'chunks_count',
                'last_processed_at',
            ]);
        });
    }
};
