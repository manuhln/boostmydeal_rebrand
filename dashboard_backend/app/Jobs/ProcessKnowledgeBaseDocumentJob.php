<?php

namespace App\Jobs;

use App\Enums\ProcessingStatus;
use App\Models\KnowledgeBase;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ProcessKnowledgeBaseDocumentJob implements ShouldQueue
{
    use Dispatchable, Queueable;

    public int $tries = 3;

    public int $timeout = 300; // 5 minutes

    public function __construct(
        public string $knowledgeBaseId
    ) {
        $this->onQueue('documents');
    }

    public function handle(): void
    {
        $knowledgeBase = KnowledgeBase::find($this->knowledgeBaseId);

        if (! $knowledgeBase) {
            Log::error('[ProcessKnowledgeBaseDocumentJob] KnowledgeBase not found', [
                'id' => $this->knowledgeBaseId,
            ]);

            return;
        }

        if (! $knowledgeBase->file_path) {
            Log::error('[ProcessKnowledgeBaseDocumentJob] No file associated', [
                'id' => $knowledgeBase->id,
            ]);

            $knowledgeBase->update(['processing_status' => ProcessingStatus::FAILED]);

            return;
        }

        // Update status to processing
        $knowledgeBase->update([
            'processing_status' => ProcessingStatus::PROCESSING,
            'chunks_count' => 0,
        ]);

        // Dispatch first job in chain
        ExtractPdfTextJob::dispatch($knowledgeBase->id, $knowledgeBase->file_path);

        Log::info('[ProcessKnowledgeBaseDocumentJob] Job chain started', [
            'kb_id' => $knowledgeBase->id,
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('[ProcessKnowledgeBaseDocumentJob] Job failed', [
            'kb_id' => $this->knowledgeBaseId,
            'error' => $exception->getMessage(),
        ]);

        $knowledgeBase = KnowledgeBase::find($this->knowledgeBaseId);
        if ($knowledgeBase) {
            $knowledgeBase->update(['processing_status' => ProcessingStatus::FAILED]);
        }
    }
}
