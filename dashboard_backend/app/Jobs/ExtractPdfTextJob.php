<?php

namespace App\Jobs;

use App\Enums\ProcessingStatus;
use App\Models\KnowledgeBase;
use App\Services\PdfExtractorService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ExtractPdfTextJob implements ShouldQueue
{
    use Dispatchable, Queueable;

    public int $tries = 3;

    public int $timeout = 120;

    public function __construct(
        public string $knowledgeBaseId,
        public string $filePath
    ) {
        $this->onQueue('documents');
    }

    public function handle(PdfExtractorService $extractor): void
    {
        $knowledgeBase = KnowledgeBase::find($this->knowledgeBaseId);

        if (! $knowledgeBase) {
            Log::error('[ExtractPdfTextJob] KnowledgeBase not found', [
                'id' => $this->knowledgeBaseId,
            ]);

            return;
        }

        $text = $extractor->extractText($this->filePath);

        if (empty($text)) {
            Log::error('[ExtractPdfTextJob] Failed to extract text', [
                'kb_id' => $knowledgeBase->id,
                'path' => $this->filePath,
            ]);

            $knowledgeBase->update(['processing_status' => ProcessingStatus::FAILED]);

            return;
        }

        // Store extracted text in database temporarily
        $knowledgeBase->update(['extracted_text' => $text]);

        // Dispatch next job in chain
        SemanticChunkTextJob::dispatch($knowledgeBase->id);

        Log::info('[ExtractPdfTextJob] Text extracted successfully', [
            'kb_id' => $knowledgeBase->id,
            'length' => strlen($text),
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('[ExtractPdfTextJob] Job failed', [
            'kb_id' => $this->knowledgeBaseId,
            'error' => $exception->getMessage(),
        ]);

        $knowledgeBase = KnowledgeBase::find($this->knowledgeBaseId);
        if ($knowledgeBase) {
            $knowledgeBase->update(['processing_status' => ProcessingStatus::FAILED]);
        }
    }
}
