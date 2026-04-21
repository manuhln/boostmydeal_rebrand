<?php

namespace App\Data\Api\V1;

use Illuminate\Http\UploadedFile;
use Spatie\LaravelData\Attributes\Validation\File;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Mimes;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class KnowledgeBaseData extends Data
{
    public function __construct(
        #[Required, Max(255)]
        public string $name,

        public Optional|string $description,

        #[File, Required, Mimes('pdf'), Max(51200)] // Max 50MB
        public Optional|UploadedFile $file,
    ) {}
}
