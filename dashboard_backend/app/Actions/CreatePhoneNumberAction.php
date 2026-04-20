<?php

namespace App\Actions;

use App\Data\Api\V1\PhoneNumberData;
use App\Models\PhoneNumber;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class CreatePhoneNumberAction
{
    public function execute(PhoneNumberData $phoneNumberData): PhoneNumber
    {
        return DB::transaction(function () use ($phoneNumberData) {

            $phone_number = PhoneNumber::create($phoneNumberData->toArray());

            $apiKey = config('services.livekit.api_key');
            $apiUrl  = config('services.livekit.url');

            $payload = $this->preparePayload($phone_number);

            $result = Http::timeout(60)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'X-API-Key'    => $apiKey,
                ])
                ->post($apiUrl . '/sip-trunks/add/outbound', $payload);

            if ($result->failed()) {
                Log::error('Failed to create SIP trunk in FastAPI', [
                    'phone_number_id' => $phone_number->id,
                    'response_status' => $result->status(),
                    'response_body'   => $result->body(),
                ]);
                throw new \Exception('Failed to create SIP trunk in FastAPI: ' . $result->body());
            }

            $phone_number->update([
                'trunk_id' => $result->json('trunk_id'),
            ]);

            Log::info('Successfully created SIP trunk in FastAPI', [
                'phone_number_id' => $phone_number->id,
                'trunk_id'        => $result->json('trunk_id'),
            ]);

            return $phone_number;
        });
    }

    private function preparePayload(PhoneNumber $phone_number): array
    {
        return match ($phone_number->provider->value) {
            'twilio' => $this->prepareTwilioPayload($phone_number),
            'voxsun' => $this->prepareVoxsunPayload($phone_number),
            default => throw new \Exception('Unsupported provider'),
        };
    }

    private function prepareTwilioPayload(PhoneNumber $phone_number): array
    {
        if (!$phone_number->provider_config || !isset($phone_number->provider_config['account_sid'], $phone_number->provider_config['auth_token'])) {
            Log::error('Missing provider configuration for Twilio', ['phone_number_id' => $phone_number->id]);
            throw new \Exception('Missing provider configuration for Twilio');
        }
        return [
            'name' => $phone_number->did,
            'phone_numbers' => [$phone_number->did],
            'auth_username' => $phone_number->provider_config['account_sid'],
            'auth_password' => $phone_number->provider_config['auth_token'],
        ];
    }

    private function prepareVoxsunPayload(PhoneNumber $phone_number): array
    {
        if (!$phone_number->provider_config || !isset($phone_number->provider_config['username']) || !isset($phone_number->provider_config['secret']) || !isset($phone_number->provider_config['sip_domain'])) {
            Log::error('Missing provider configuration for Voxsun', ['phone_number_id' => $phone_number->id]);
            throw new \Exception('Missing provider configuration for Voxsun');
        }
        return [
            'name' => $phone_number->did,
            'phone_numbers' => [$phone_number->did],
            'auth_username' => $phone_number->provider_config['username'],
            'auth_password' => $phone_number->provider_config['secret'],
            'address' => $phone_number->provider_config['sip_domain'],
        ];
    }
}
