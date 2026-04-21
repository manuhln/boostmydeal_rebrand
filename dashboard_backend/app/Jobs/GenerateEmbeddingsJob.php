<?php

namespace App\Jobs;

use App\Enums\ProcessingStatus;
use App\Models\KnowledgeBase;
use App\Services\OpenAiEmbeddingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class GenerateEmbeddingsJob implements ShouldQueue
{
    use Dispatchable, Queueable;

    public int $tries = 2;

    public int $timeout = 300; // 5 minutes for batch embeddings

    public function __construct(
        public string $knowledgeBaseId
    ) {
        $this->onQueue('documents');
    }

    public function handle(OpenAiEmbeddingService $embeddingService): void
    {
        $knowledgeBase = KnowledgeBase::find($this->knowledgeBaseId);

        if (! $knowledgeBase) {
            Log::error('[GenerateEmbeddingsJob] KnowledgeBase not found', [
                'id' => $this->knowledgeBaseId,
            ]);

            return;
        }

        $chunks = $knowledgeBase->chunks ?? null;

        if (empty($chunks)) {
            Log::error('[GenerateEmbeddingsJob] No chunks found', [
                'kb_id' => $knowledgeBase->id,
            ]);

            $knowledgeBase->update(['processing_status' => ProcessingStatus::FAILED]);

            return;
        }

        // Extract texts from chunks
        $texts = array_column($chunks, 'text');

        // Generate embeddings in batch
        $embeddings = $embeddingService->batchGenerateEmbeddings($texts, batchSize: 50);

        // Combine chunks with embeddings
        $points = [];
        foreach ($chunks as $index => $chunk) {
            if (isset($embeddings[$index])) {
                $points[] = [
                    'id' => Str::uuid7(),
                    'vector' => $embeddings[$index],
                    'payload' => [
                        'tenant_id' => tenant('id'),
                        'knowledge_base_id' => $knowledgeBase->id,
                        'chunk_index' => $chunk['index'],
                        'text' => $chunk['text'],
                        'paragraph_start' => $chunk['paragraph_start'] ?? null,
                        'file_name' => $knowledgeBase->file_name,
                        'created_at' => now()->toIso8601String(),
                    ],
                ];
            } else {
                Log::warning('[GenerateEmbeddingsJob] Failed to generate embedding for chunk', [
                    'kb_id' => $knowledgeBase->id,
                    'chunk_index' => $index,
                ]);
            }
        }

        if (empty($points)) {
            Log::error('[GenerateEmbeddingsJob] No embeddings generated', [
                'kb_id' => $knowledgeBase->id,
            ]);

            $knowledgeBase->update(['processing_status' => ProcessingStatus::FAILED]);

            return;
        }

        // Store points for next job
        $knowledgeBase->update(['embedding_points' => $points, 'chunks_count' => count($points)]);

        // Dispatch next job in chain
        StoreInQdrantJob::dispatch($knowledgeBase->id);

        Log::info('[GenerateEmbeddingsJob] Embeddings generated', [
            'kb_id' => $knowledgeBase->id,
            'total_chunks' => count($chunks),
            'successful_embeddings' => count($points),
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('[GenerateEmbeddingsJob] Job failed', [
            'kb_id' => $this->knowledgeBaseId,
            'error' => $exception->getMessage(),
        ]);

        $knowledgeBase = KnowledgeBase::find($this->knowledgeBaseId);
        if ($knowledgeBase) {
            $knowledgeBase->update(['processing_status' => ProcessingStatus::FAILED]);
        }
    }
}
