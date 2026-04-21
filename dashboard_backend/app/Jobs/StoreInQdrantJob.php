<?php

namespace App\Jobs;

use App\Enums\ProcessingStatus;
use App\Models\KnowledgeBase;
use App\Services\QdrantService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class StoreInQdrantJob implements ShouldQueue
{
    use Dispatchable, Queueable;

    public int $tries = 3;

    public int $timeout = 120;

    public function __construct(
        public string $knowledgeBaseId
    ) {
        $this->onQueue('documents');
    }

    public function handle(QdrantService $qdrant): void
    {
        $knowledgeBase = KnowledgeBase::find($this->knowledgeBaseId);

        if (! $knowledgeBase) {
            Log::error('[StoreInQdrantJob] KnowledgeBase not found', [
                'id' => $this->knowledgeBaseId,
            ]);

            return;
        }

        $points = $knowledgeBase->embedding_points ?? null;

        if (empty($points)) {
            Log::error('[StoreInQdrantJob] No points to store', [
                'kb_id' => $knowledgeBase->id,
            ]);

            $knowledgeBase->update(['processing_status' => ProcessingStatus::FAILED]);

            return;
        }

        // Ensure collection exists
        if (! $qdrant->collectionExists()) {
            $qdrant->createCollection();
        }

        // Store points in Qdrant
        $success = $qdrant->upsertPoints($points);

        if (! $success) {
            $knowledgeBase->update(['processing_status' => ProcessingStatus::FAILED]);

            return;
        }

        // Dispatch next job in chain
        UpdateKnowledgeBaseStatusJob::dispatch(
            $knowledgeBase->id,
            ProcessingStatus::COMPLETED
        );

        Log::info('[StoreInQdrantJob] Points stored in Qdrant', [
            'kb_id' => $knowledgeBase->id,
            'count' => count($points),
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('[StoreInQdrantJob] Job failed', [
            'kb_id' => $this->knowledgeBaseId,
            'error' => $exception->getMessage(),
        ]);

        $knowledgeBase = KnowledgeBase::find($this->knowledgeBaseId);
        if ($knowledgeBase) {
            $knowledgeBase->update(['processing_status' => ProcessingStatus::FAILED]);
        }
    }
}
