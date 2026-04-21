<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class QdrantService
{
    protected string $url;

    protected ?string $apiKey;

    protected string $collection;

    protected int $vectorSize;

    public function __construct()
    {
        $this->url = config('qdrant.url');
        $this->apiKey = config('qdrant.api_key');
        $this->collection = config('qdrant.collection', 'knowledge_base_chunks');
        $this->vectorSize = (int) config('qdrant.vector_size', 1536);
    }

    /**
     * Get request headers.
     */
    protected function headers(): array
    {
        $headers = [
            'Content-Type' => 'application/json',
        ];

        if (! empty($this->apiKey)) {
            $headers['api-key'] = $this->apiKey;
        }

        return $headers;
    }

    /**
     * Create a collection if it doesn't exist.
     */
    public function createCollection(?string $collection = null, ?int $vectorSize = null): bool
    {
        $collectionName = $collection ?? $this->collection;
        $size = $vectorSize ?? $this->vectorSize;

        try {
            $response = Http::timeout(30)
                ->withHeaders($this->headers())
                ->put("{$this->url}/collections/{$collectionName}", [
                    'vectors' => [
                        'size' => $size,
                        'distance' => 'Cosine',
                    ],
                ]);

            $success = $response->successful() || $response->status() === 409; // 409 = already exists

            if (! $success) {
                Log::error('[QdrantService] Failed to create collection', [
                    'collection' => $collectionName,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            } else {
                Log::info('[QdrantService] Collection ready', ['collection' => $collectionName]);
            }

            return $success;
        } catch (\Exception $e) {
            Log::error('[QdrantService] Exception creating collection', [
                'collection' => $collectionName,
                'message' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Upsert points to collection.
     */
    public function upsertPoints(array $points, ?string $collection = null): bool
    {
        $collectionName = $collection ?? $this->collection;

        try {
            $response = Http::timeout(60)
                ->withHeaders($this->headers())
                ->put("{$this->url}/collections/{$collectionName}/points", [
                    'points' => $points,
                ]);

            $success = $response->successful();

            if (! $success) {
                Log::error('[QdrantService] Failed to upsert points', [
                    'collection' => $collectionName,
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'points_count' => count($points),
                ]);
            } else {
                Log::info('[QdrantService] Points upserted', [
                    'collection' => $collectionName,
                    'count' => count($points),
                ]);
            }

            return $success;
        } catch (\Exception $e) {
            Log::error('[QdrantService] Exception upserting points', [
                'collection' => $collectionName,
                'message' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Delete points by filter.
     */
    public function deletePointsByFilter(array $filter, ?string $collection = null): bool
    {
        $collectionName = $collection ?? $this->collection;

        try {
            $response = Http::timeout(30)
                ->withHeaders($this->headers())
                ->post("{$this->url}/collections/{$collectionName}/points/delete", [
                    'filter' => $filter,
                ]);

            $success = $response->successful();

            if (! $success) {
                Log::error('[QdrantService] Failed to delete points', [
                    'collection' => $collectionName,
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'filter' => $filter,
                ]);
            } else {
                Log::info('[QdrantService] Points deleted', [
                    'collection' => $collectionName,
                    'filter' => $filter,
                ]);
            }

            return $success;
        } catch (\Exception $e) {
            Log::error('[QdrantService] Exception deleting points', [
                'collection' => $collectionName,
                'message' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Search points in collection.
     */
    public function search(array $vector, int $limit = 5, ?array $filter = null, ?string $collection = null): array
    {
        $collectionName = $collection ?? $this->collection;

        try {
            $payload = [
                'limit' => $limit,
                'with_payload' => true,
                'vector' => $vector,
            ];

            if ($filter !== null) {
                $payload['filter'] = $filter;
            }

            $response = Http::timeout(30)
                ->withHeaders($this->headers())
                ->post("{$this->url}/collections/{$collectionName}/points/search", $payload);

            if (! $response->successful()) {
                Log::error('[QdrantService] Search failed', [
                    'collection' => $collectionName,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [];
            }

            $data = $response->json();
            $results = $data['result'] ?? [];

            Log::debug('[QdrantService] Search completed', [
                'collection' => $collectionName,
                'results' => count($results),
            ]);

            return $results;
        } catch (\Exception $e) {
            Log::error('[QdrantService] Exception during search', [
                'collection' => $collectionName,
                'message' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * Check if collection exists.
     */
    public function collectionExists(?string $collection = null): bool
    {
        $collectionName = $collection ?? $this->collection;

        try {
            $response = Http::timeout(10)
                ->withHeaders($this->headers())
                ->get("{$this->url}/collections/{$collectionName}");

            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Build filter for knowledge base ID.
     */
    public static function filterByKnowledgeBaseId(string $knowledgeBaseId): array
    {
        return [
            'must' => [
                [
                    'key' => 'knowledge_base_id',
                    'match' => [
                        'value' => $knowledgeBaseId,
                    ],
                ],
            ],
        ];
    }

    /**
     * Build filter for tenant ID.
     */
    public static function filterByTenantId(string $tenantId): array
    {
        return [
            'must' => [
                [
                    'key' => 'tenant_id',
                    'match' => [
                        'value' => $tenantId,
                    ],
                ],
            ],
        ];
    }
}
