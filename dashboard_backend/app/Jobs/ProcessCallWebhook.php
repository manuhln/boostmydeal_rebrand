<?php

namespace App\Jobs;

use App\Enums\CallEventType;
use App\Enums\CallStatus;
use App\Models\Call;
use App\Models\CallEvent;
use App\Models\CallRecording;
use App\Models\CallTranscript;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class ProcessCallWebhook implements ShouldQueue
{
    use Dispatchable, Queueable;

    public int $tries = 3;

    public int $timeout = 120;

    public function __construct(
        public array $payload
    ) {
        $this->onQueue('calls');
    }

    public function handle(): void
    {
        $call = Call::find($this->payload['call_id']);

        if (! $call) {
            Log::warning('Received call webhook for unknown call.', [
                'event' => $this->payload['event'] ?? null,
                'call_id' => $this->payload['call_id'] ?? null,
            ]);

            return;
        }

        $eventId = $this->payload['event_id'] ?? null;

        if ($eventId && CallEvent::query()->where('call_id', $call->id)->where('source_event_id', $eventId)->exists()) {
            return;
        }

        $eventType = $this->payload['event'] ?? '';

        match ($eventType) {
            'call.started' => $this->handleCallStarted($call),
            'call.transcript.segment' => $this->handleTranscriptSegment($call),
            'call.transcript.completed' => $this->handleTranscriptCompleted($call),
            'call.recording.completed' => $this->handleRecordingCompleted($call),
            'call.ended' => $this->handleCallEnded($call),
            'call.error' => $this->handleCallError($call),
            default => Log::info('Ignoring unsupported call webhook event.', [
                'event' => $eventType,
                'call_id' => $call->id,
            ]),
        };
    }

    private function handleCallStarted(Call $call): void
    {
        if ($call->status !== CallStatus::IN_PROGRESS) {
            $call->update([
                'status' => CallStatus::IN_PROGRESS,
            ]);
        }

        $this->storeEvent($call, CallEventType::CALL_STARTED);
    }

    private function handleTranscriptSegment(Call $call): void
    {
        CallTranscript::updateOrCreate(
            [
                'call_id' => $call->id,
                'segment_id' => $this->payload['segment_id'],
            ],
            [
                'speaker' => $this->payload['speaker'],
                'content' => $this->payload['content'] ?? '',
                'timestamp_ms' => (int) ($this->payload['timestamp_ms'] ?? 0),
                'sequence' => (int) ($this->payload['sequence'] ?? 0),
                'is_final' => (bool) ($this->payload['is_final'] ?? false),
                'metadata' => [
                    'language' => $this->payload['language'] ?? null,
                    'room_name' => $this->payload['room_name'] ?? null,
                    'updated_at' => $this->payload['occurred_at'] ?? null,
                ],
            ],
        );

        $this->storeEvent($call, CallEventType::LIVE_TRANSCRIPT);
    }

    private function handleTranscriptCompleted(Call $call): void
    {
        $this->storeEvent($call, CallEventType::TRANSCRIPT_COMPLETED);
    }

    private function handleRecordingCompleted(Call $call): void
    {
        $recording = CallRecording::updateOrCreate(
            [
                'call_id' => $call->id,
                'object_key' => $this->payload['object_key'] ?? null,
            ],
            [
                'disk' => $this->payload['disk'] ?? 'minio',
                'url' => $this->payload['object_key'] ?? ($call->recording_url ?? ''),
                'duration_seconds' => (int) ($this->payload['duration_seconds'] ?? 0),
                'format' => $this->payload['format'] ?? null,
                'mime_type' => $this->payload['mime_type'] ?? null,
                'file_size' => isset($this->payload['file_size']) ? (int) $this->payload['file_size'] : null,
                'metadata' => [
                    'egress_id' => $this->payload['egress_id'] ?? null,
                    'room_name' => $this->payload['room_name'] ?? null,
                ],
            ],
        );

        $call->update([
            'recording_url' => $recording->object_key ?? $recording->url,
        ]);

        $this->storeEvent($call, CallEventType::RECORDING_COMPLETED);
    }

    private function handleCallEnded(Call $call): void
    {
        $durationSeconds = (int) round(((int) ($this->payload['duration_ms'] ?? 0)) / 1000);

        $call->update([
            'status' => CallStatus::COMPLETED,
            'duration_seconds' => max($call->duration_seconds, $durationSeconds),
        ]);

        $this->storeEvent($call, CallEventType::CALL_COMPLETED);
    }

    private function handleCallError(Call $call): void
    {
        $call->update([
            'status' => CallStatus::FAILED,
        ]);

        $this->storeEvent($call, CallEventType::CALL_ERROR);
    }

    private function storeEvent(Call $call, CallEventType $eventType): void
    {
        CallEvent::create([
            'call_id' => $call->id,
            'source_event_id' => $this->payload['event_id'] ?? null,
            'event_type' => $eventType,
            'payload' => $this->payload + [
                'processed_at' => Carbon::now()->toIso8601String(),
            ],
        ]);
    }
}
