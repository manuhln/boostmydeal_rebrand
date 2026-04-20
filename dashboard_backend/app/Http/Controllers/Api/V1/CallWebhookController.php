<?php

namespace App\Http\Controllers\Api\V1;

use App\Jobs\ProcessCallWebhook;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class CallWebhookController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'event_id' => ['required', 'string'],
            'event' => ['required', 'string'],
            'call_id' => ['required', 'string'],
            'tenant_id' => ['required', 'string'],
        ]);

        $signature = $request->header('X-Webhook-Signature');
        $secret = config('services.livekit.webhook_secret');

        if ($secret && (! $signature || ! hash_equals(hash_hmac('sha256', $request->getContent(), $secret), $signature))) {
            Log::warning('Rejected call webhook with invalid signature.', [
                'event' => $payload['event'] ?? null,
                'call_id' => $payload['call_id'] ?? null,
            ]);

            return $this->errorResponse(
                message: 'Invalid webhook signature.',
                code: Response::HTTP_UNAUTHORIZED,
            );
        }

        $tenant = Tenant::find($payload['tenant_id']);

        if (! $tenant) {
            return $this->errorResponse(
                message: 'Tenant not found.',
                code: Response::HTTP_NOT_FOUND,
            );
        }

        tenancy()->initialize($tenant);

        try {
            ProcessCallWebhook::dispatch($request->all());
        } finally {
            tenancy()->end();
        }

        return $this->successResponse(
            ['queued' => true],
            'Webhook queued for processing.',
            Response::HTTP_ACCEPTED,
        );
    }
}
