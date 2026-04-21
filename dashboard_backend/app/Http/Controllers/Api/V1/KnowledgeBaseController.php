<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\Api\V1\KnowledgeBaseData;
use App\Enums\ProcessingStatus;
use App\Http\Resources\Api\V1\KnowledgeBaseResource;
use App\Jobs\DeleteKnowledgeBaseFromQdrantJob;
use App\Jobs\ProcessKnowledgeBaseDocumentJob;
use App\Models\KnowledgeBase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

/**
 * @authenticated
 *
 * @group Knowledge Bases
 */
class KnowledgeBaseController extends Controller
{
    /**
     * List all knowledge bases
     *
     * @authenticated
     *
     * @queryParam filter[name] string optional Filter by name (partial match)
     * @queryParam filter[document_type] string optional Filter by document type
     * @queryParam sort string optional Sort by field (name, created_at, updated_at)
     * @queryParam filter[agents] string optional Include agents in response
     *
     * @response {"data": [{"id": 1, "name": "Product FAQ", "document_type": "pdf"}], "meta": {...}}
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $knowledgeBases = QueryBuilder::for(KnowledgeBase::class)
            ->allowedFilters(
                AllowedFilter::partial('name'),
                AllowedFilter::exact('document_type'),
            )
            ->allowedSorts(
                'name',
                'created_at',
                'updated_at',
            )
            ->defaultSort('-created_at')
            ->allowedIncludes('agents')
            ->paginate($request->input('per_page', 15));

        return KnowledgeBaseResource::collection($knowledgeBases);
    }

    /**
     * Create a new knowledge base
     *
     * @authenticated
     *
     * @bodyParam name string required Knowledge base name
     * @bodyParam description string optional Knowledge base description
     * @bodyParam document_type string optional Document type
     * @bodyParam file file optional PDF file to upload (max 50MB)
     *
     * @response {"id": 1, "name": "Product FAQ", "processing_status": "pending"}
     */
    public function store(KnowledgeBaseData $data): KnowledgeBaseResource|JsonResponse
    {
        $attributes = $data->except('file')->toArray();

        // Handle file upload
        if ($data->file) {
            $tenantId = tenant('id');
            $fileName = $data->file->getClientOriginalName();
            $uniqueFileName = pathinfo($fileName, PATHINFO_FILENAME).'_'.uniqid().'.'.$data->file->getClientOriginalExtension();

            $filePath = $data->file->storeAs(
                "knowledge-bases/{$tenantId}",
                $uniqueFileName,
                'r2'
            );

            $attributes['file_path'] = $filePath;
            $attributes['file_name'] = $fileName;
            $attributes['file_size'] = $data->file->getSize();
            $attributes['processing_status'] = ProcessingStatus::PENDING;
            $attributes['document_type'] = 'pdf';
        }

        $knowledgeBase = KnowledgeBase::create($attributes);

        // Dispatch processing job if file was uploaded
        if ($data->file) {
            ProcessKnowledgeBaseDocumentJob::dispatch($knowledgeBase->id);
        }

        return new KnowledgeBaseResource($knowledgeBase);
    }

    /**
     * Get a specific knowledge base
     *
     * @authenticated
     *
     * @urlParam knowledgeBase int required The ID of the knowledge base
     *
     * @queryParam filter[agents] string optional Include agents in response
     *
     * @response {"id": 1, "name": "Product FAQ", "document_type": "pdf", "agents": [...]}
     */
    public function show(Request $request, KnowledgeBase $knowledgeBase): KnowledgeBaseResource
    {
        $knowledgeBase = QueryBuilder::for($knowledgeBase)
            ->allowedIncludes('agents')
            ->first();

        return new KnowledgeBaseResource($knowledgeBase);
    }

    /**
     * Update a knowledge base
     *
     * @authenticated
     *
     * @urlParam knowledgeBase int required The ID of the knowledge base
     *
     * @bodyParam name string optional Knowledge base name
     * @bodyParam description string optional Knowledge base description
     * @bodyParam document_type string optional Document type
     * @bodyParam file file optional PDF file to upload (max 50MB)
     *
     * @response {"id": 1, "name": "Updated FAQ", "processing_status": "pending"}
     */
    public function update(KnowledgeBaseData $data, KnowledgeBase $knowledgeBase): KnowledgeBaseResource
    {
        $attributes = $data->except('file')->toArray();

        // Handle file upload (re-upload)
        if ($data->file) {
            // Delete old file from r2/R2
            if ($knowledgeBase->file_path) {
                Storage::disk('r2')->delete($knowledgeBase->file_path);
            }

            // Delete old chunks from Qdrant
            DeleteKnowledgeBaseFromQdrantJob::dispatch($knowledgeBase->id);

            $tenantId = tenant('id');
            $fileName = $data->file->getClientOriginalName();
            $uniqueFileName = pathinfo($fileName, PATHINFO_FILENAME).'_'.uniqid().'.'.$data->file->getClientOriginalExtension();

            $filePath = $data->file->storeAs(
                "knowledge-bases/{$tenantId}",
                $uniqueFileName,
                'r2'
            );

            $attributes['file_path'] = $filePath;
            $attributes['file_name'] = $fileName;
            $attributes['file_size'] = $data->file->getSize();
            $attributes['processing_status'] = ProcessingStatus::PENDING;
            $attributes['chunks_count'] = 0;
            $attributes['document_type'] = 'pdf';

            // Dispatch processing job
            ProcessKnowledgeBaseDocumentJob::dispatch($knowledgeBase->id);
        }

        $knowledgeBase->update($attributes);

        return new KnowledgeBaseResource($knowledgeBase->fresh());
    }

    /**
     * Delete a knowledge base
     *
     * @authenticated
     *
     * @urlParam knowledgeBase int required The ID of the knowledge base
     *
     * @response 204
     */
    public function destroy(KnowledgeBase $knowledgeBase): JsonResponse
    {
        $kbId = $knowledgeBase->id;

        // Delete from Qdrant
        DeleteKnowledgeBaseFromQdrantJob::dispatch($kbId);

        // Delete file from r2/R2
        if ($knowledgeBase->file_path) {
            Storage::disk('r2')->delete($knowledgeBase->file_path);
        }

        $knowledgeBase->delete();

        return response()->json(null, 204);
    }
}
