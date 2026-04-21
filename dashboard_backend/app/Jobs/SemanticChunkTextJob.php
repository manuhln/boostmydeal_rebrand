<?php

namespace App\Jobs;

use App\Enums\ProcessingStatus;
use App\Models\KnowledgeBase;
use App\Services\SemanticChunkerService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class SemanticChunkTextJob implements ShouldQueue
{
    use Dispatchable, Queueable;

    public int $tries = 3;

    public int $timeout = 120;

    public function __construct(
        public string $knowledgeBaseId
    ) {
        $this->onQueue('documents');
    }

    public function handle(SemanticChunkerService $chunker): void
    {
        $knowledgeBase = KnowledgeBase::find($this->knowledgeBaseId);

        if (! $knowledgeBase) {
            Log::error('[SemanticChunkTextJob] KnowledgeBase not found', [
                'id' => $this->knowledgeBaseId,
            ]);

            return;
        }

        $text = $knowledgeBase->extracted_text ?? null;

        if (empty($text)) {
            Log::error('[SemanticChunkTextJob] No extracted text found', [
                'kb_id' => $knowledgeBase->id,
            ]);

            $knowledgeBase->update(['processing_status' => ProcessingStatus::FAILED]);

            return;
        }

        $chunks = $chunker->chunkText($text, [
            'max_chunk_size' => 1000,
            'min_chunk_size' => 100,
            'overlap' => 100,
        ]);

        if (empty($chunks)) {
            Log::error('[SemanticChunkTextJob] No chunks generated', [
                'kb_id' => $knowledgeBase->id,
            ]);

            $knowledgeBase->update(['processing_status' => ProcessingStatus::FAILED]);

            return;
        }

        // Store chunks temporarily in database
        $knowledgeBase->update(['chunks' => $chunks]);

        // Dispatch next job in chain
        GenerateEmbeddingsJob::dispatch($knowledgeBase->id);

        Log::info('[SemanticChunkTextJob] Chunks created', [
            'kb_id' => $knowledgeBase->id,
            'count' => count($chunks),
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('[SemanticChunkTextJob] Job failed', [
            'kb_id' => $this->knowledgeBaseId,
            'error' => $exception->getMessage(),
        ]);

        $knowledgeBase = KnowledgeBase::find($this->knowledgeBaseId);
        if ($knowledgeBase) {
            $knowledgeBase->update(['processing_status' => ProcessingStatus::FAILED]);
        }
    }
}
