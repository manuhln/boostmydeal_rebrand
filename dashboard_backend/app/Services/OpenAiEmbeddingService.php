<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAiEmbeddingService
{
    protected string $apiKey;

    protected string $model;

    protected string $endpoint;

    protected int $vectorSize;

    public function __construct()
    {
        $this->apiKey = config('services.openai.api_key', env('OPENAI_API_KEY'));
        $this->model = env('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small');
        $this->vectorSize = (int) config('qdrant.vector_size', 1536);
        $this->endpoint = 'https://api.openai.com/v1/embeddings';
    }

    /**
     * Generate embedding for a single text.
     *
     * @param  string  $text  Text to embed
     * @return array<float>|null Vector embedding
     */
    public function generateEmbedding(string $text): ?array
    {
        if (empty($this->apiKey)) {
            Log::error('[OpenAiEmbeddingService] OpenAI API key not configured');

            return null;
        }

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => 'Bearer '.$this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post($this->endpoint, [
                    'model' => $this->model,
                    'input' => $text,
                    'encoding_format' => 'float',
                ]);

            if (! $response->successful()) {
                Log::error('[OpenAiEmbeddingService] API request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $data = $response->json();
            $embedding = $data['data'][0]['embedding'] ?? null;

            Log::debug('[OpenAiEmbeddingService] Embedding generated', [
                'model' => $this->model,
                'vector_size' => count($embedding ?? []),
            ]);

            return $embedding;
        } catch (\Exception $e) {
            Log::error('[OpenAiEmbeddingService] Exception occurred', [
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Generate embeddings for multiple texts using batch API.
     *
     * @param  array  $texts  Array of texts to embed
     * @param  int  $batchSize  Number of texts per batch request
     * @return array Array of embeddings or null values for failures
     */
    public function batchGenerateEmbeddings(array $texts, int $batchSize = 100): array
    {
        if (empty($this->apiKey)) {
            Log::error('[OpenAiEmbeddingService] OpenAI API key not configured');

            return array_fill(0, count($texts), null);
        }

        $embeddings = array_fill(0, count($texts), null);
        $batches = array_chunk($texts, $batchSize);

        foreach ($batches as $batchIndex => $batch) {
            try {
                $response = Http::timeout(60)
                    ->withHeaders([
                        'Authorization' => 'Bearer '.$this->apiKey,
                        'Content-Type' => 'application/json',
                    ])
                    ->post($this->endpoint, [
                        'model' => $this->model,
                        'input' => $batch,
                        'encoding_format' => 'float',
                    ]);

                if (! $response->successful()) {
                    Log::error('[OpenAiEmbeddingService] Batch API request failed', [
                        'batch' => $batchIndex,
                        'status' => $response->status(),
                        'body' => $response->body(),
                    ]);

                    continue;
                }

                $data = $response->json();
                $batchEmbeddings = $data['data'] ?? [];

                foreach ($batchEmbeddings as $item) {
                    $index = $item['index'];
                    $embeddings[$batchIndex * $batchSize + $index] = $item['embedding'] ?? null;
                }

                Log::info('[OpenAiEmbeddingService] Batch embeddings generated', [
                    'batch' => $batchIndex,
                    'count' => count($batchEmbeddings),
                ]);

                // Small delay to avoid rate limiting
                if (count($batches) > 1 && $batchIndex < count($batches) - 1) {
                    usleep(100000); // 100ms
                }
            } catch (\Exception $e) {
                Log::error('[OpenAiEmbeddingService] Batch exception', [
                    'batch' => $batchIndex,
                    'message' => $e->getMessage(),
                ]);
            }
        }

        return $embeddings;
    }

    /**
     * Generate query embedding for retrieval.
     */
    public function generateQueryEmbedding(string $query): ?array
    {
        return $this->generateEmbedding($query);
    }
}
