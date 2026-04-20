<?php

use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/openapi', function () {
    abort_unless(
        Storage::disk('local')->exists('scribe/openapi.yaml'),
        404
    );

    return Response::make(
        Storage::disk('local')->get('scribe/openapi.yaml'),
        200,
        [
            'Content-Type' => 'application/yaml',
        ]
    );
});

Route::get('/openapi-test', function () {
    return response()->json([
        'ok' => true,
        'route' => 'openapi-test',
    ]);
});

Route::get('/openapi-debug', function () {
    $disk = Storage::disk('local');
    $relativePath = 'scribe/openapi.yaml';
    $storagePath = storage_path('app/private/scribe/openapi.yaml');

    return response()->json([
        'tenant' => tenant('id'),
        'storage_path' => $storagePath,
        'disk_path' => method_exists($disk, 'path') ? $disk->path($relativePath) : null,
        'disk_exists' => $disk->exists($relativePath),
        'file_exists_storage_path' => file_exists($storagePath),
        'config_filesystems_default' => config('filesystems.default'),
        'config_local_root' => config('filesystems.disks.local.root'),
    ]);
});
