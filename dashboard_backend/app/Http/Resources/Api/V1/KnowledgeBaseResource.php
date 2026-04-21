<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Resources\JsonApi\JsonApiResource;

class KnowledgeBaseResource extends JsonApiResource
{
    public $attributes = [
        'name',
        'description',
        'document_url',
        'document_type',
        'file_name',
        'file_size',
        's3_url',
        'processing_status',
        'chunks_count',
        'last_processed_at',
        'extracted_text',
        'chunks',
        'embedding_points',
        'created_at',
        'updated_at',
    ];

    public $relationships = [
        'agents',
    ];
}
