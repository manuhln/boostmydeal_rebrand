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
        Schema::table('call_recordings', function (Blueprint $table) {
            $table->string('disk')->default('minio')->after('call_id');
            $table->string('object_key')->nullable()->after('disk');
            $table->string('format')->nullable()->after('object_key');
            $table->string('mime_type')->nullable()->after('format');
            $table->unsignedBigInteger('file_size')->nullable()->after('mime_type');
            $table->jsonb('metadata')->nullable()->after('duration_seconds');

            $table->index(['call_id', 'object_key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('call_recordings', function (Blueprint $table) {
            $table->dropIndex(['call_id', 'object_key']);
            $table->dropColumn([
                'disk',
                'object_key',
                'format',
                'mime_type',
                'file_size',
                'metadata',
            ]);
        });
    }
};
