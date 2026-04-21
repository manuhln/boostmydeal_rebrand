<?php

namespace App\Jobs;

use App\Enums\ProcessingStatus;
use App\Models\KnowledgeBase;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class UpdateKnowledgeBaseStatusJob implements ShouldQueue
{
    use Dispatchable, Queueable;

    public int $tries = 3;

    public int $timeout = 30;

    public function __construct(
        public string $knowledgeBaseId,
        public ProcessingStatus $status
    ) {
        $this->onQueue('documents');
    }

    public function handle(): void
    {
        $knowledgeBase = KnowledgeBase::find($this->knowledgeBaseId);

        if (! $knowledgeBase) {
            Log::error('[UpdateKnowledgeBaseStatusJob] KnowledgeBase not found', [
                'id' => $this->knowledgeBaseId,
            ]);

            return;
        }

        $knowledgeBase->update([
            'processing_status' => $this->status,
            'last_processed_at' => now(),
        ]);

        Log::info('[UpdateKnowledgeBaseStatusJob] Status updated', [
            'kb_id' => $knowledgeBase->id,
            'status' => $this->status->value,
            'chunks_count' => $knowledgeBase->chunks_count,
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('[UpdateKnowledgeBaseStatusJob] Job failed', [
            'kb_id' => $this->knowledgeBaseId,
            'status' => $this->status->value,
            'error' => $exception->getMessage(),
        ]);
    }
}
