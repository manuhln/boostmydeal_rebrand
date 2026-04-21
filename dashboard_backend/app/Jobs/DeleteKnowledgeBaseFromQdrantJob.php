<?php

namespace App\Jobs;

use App\Services\QdrantService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class DeleteKnowledgeBaseFromQdrantJob implements ShouldQueue
{
    use Dispatchable, Queueable;

    public int $tries = 3;

    public int $timeout = 60;

    public function __construct(
        public string $knowledgeBaseId
    ) {
        $this->onQueue('documents');
    }

    public function handle(QdrantService $qdrant): void
    {
        $filter = QdrantService::filterByKnowledgeBaseId($this->knowledgeBaseId);

        $success = $qdrant->deletePointsByFilter($filter);

        if ($success) {
            Log::info('[DeleteKnowledgeBaseFromQdrantJob] Points deleted', [
                'kb_id' => $this->knowledgeBaseId,
            ]);
        } else {
            Log::warning('[DeleteKnowledgeBaseFromQdrantJob] Failed to delete points', [
                'kb_id' => $this->knowledgeBaseId,
            ]);
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('[DeleteKnowledgeBaseFromQdrantJob] Job failed', [
            'kb_id' => $this->knowledgeBaseId,
            'error' => $exception->getMessage(),
        ]);
    }
}
