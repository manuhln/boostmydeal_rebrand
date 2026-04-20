<?php

namespace App\Data\Api\V1;

use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Numeric;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class UpdateAgentData extends Data
{
    public function __construct(
        public Optional|string $name,

        public Optional|string $description,

        public Optional|string $language,

        public Optional|string $mode,

        public Optional|string $llm_provider,
        public Optional|string $llm_model,
        public Optional|string $stt_provider,
        public Optional|string $stt_model,
        public Optional|string $tts_provider,
        public Optional|string $tts_model,
        public Optional|string $tts_voice,
        public Optional|string $realtime_provider,
        public Optional|string $first_message,
        public Optional|bool $user_speaks_first,
        public Optional|string $identity,
        public Optional|string $style,
        public Optional|string $goal,
        public Optional|string $voicemail_message,
        public Optional|string $response_guideline,
        public Optional|string $fallback,
        #[Numeric, Max(2)]
        public Optional|float $temperature,
        public Optional|bool $call_recording,
        public Optional|string $recording_format,
        public Optional|bool $remember_lead_preference,
        public Optional|bool $enable_human_transfer,
        public Optional|bool $enable_background_sound,
        public Optional|bool $background_sound,
        public Optional|bool $enable_interruptions,
        public Optional|bool $enable_vad,
        public Optional|string $phone_number_id,
    ) {
    }
}
