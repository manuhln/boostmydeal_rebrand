<?php

namespace App\Models;

use App\Enums\ProcessingStatus;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\Storage;

#[Guarded(['id', 'created_at', 'updated_at'])]
#[Hidden(['id', 'created_at', 'updated_at'])]
class KnowledgeBase extends Model
{
    use HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    protected function casts(): array
    {
        return [
            'processing_status' => ProcessingStatus::class,
            'file_size' => 'integer',
            'chunks_count' => 'integer',
            'last_processed_at' => 'datetime',
            'extracted_text' => 'array',
            'chunks' => 'array',
            'embedding_points' => 'array',
        ];
    }

    /**
     * Get the appends array for JSON resource.
     */
    public function toArray(): array
    {
        $array = parent::toArray();
        $array['s3_url'] = $this->s3_url;

        return $array;
    }

    public function agents(): BelongsToMany
    {
        return $this->belongsToMany(Agent::class, 'knowledge_bases_agents');
    }

    public function getS3UrlAttribute(): ?string
    {
        if (! $this->file_path) {
            return null;
        }

        return Storage::disk('r2')->url($this->file_path);
    }

    public function scopeWithProcessingStatus($query, string $status)
    {
        return $query->where('processing_status', $status);
    }
}
