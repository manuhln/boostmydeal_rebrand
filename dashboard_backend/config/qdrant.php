<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Qdrant Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Qdrant vector database connection and settings.
    |
    */

    'url' => env('QDRANT_URL', 'http://localhost:6333'),
    'api_key' => env('QDRANT_API_KEY'),
    'collection' => env('QDRANT_COLLECTION', 'knowledge_base_chunks'),
    'vector_size' => (int) env('QDRANT_VECTOR_SIZE', 1536), // Matches OpenAI text-embedding-3-small
];
